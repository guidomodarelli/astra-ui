/**
 * @module playwright-orphan-cleanup Closes Playwright WebKit helpers left behind by runs that were killed on Windows.
 *
 * When a Playwright run dies abruptly (TerminateProcess, a closed session, an agent timeout), Windows does not kill
 * its children and `globalTeardown` never runs: WebKit's `Playwright.exe` and its `WebKitGPUProcess.exe`,
 * `WebKitNetworkProcess.exe` and `WebKitWebProcess.exe` helpers stay alive without a parent and keep the repository
 * folder locked as their working directory. Wired as `globalSetup` and `globalTeardown` of the Playwright
 * configurations, and runnable by hand with `pnpm test:browser:cleanup`.
 *
 * It only closes helpers that match both conditions: the executable lives inside an `ms-playwright` folder and its
 * parent process no longer exists (or is itself being closed as an orphan). Windows reuses process identifiers, so a
 * live process that started after the helper cannot be its parent. A helper whose parent is alive belongs to a running
 * browser and is never touched; when either start time is unknown, the parent is assumed alive.
 */
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  ORPHAN_CLEANUP_PLATFORM,
  PLAYWRIGHT_BROWSERS_FOLDER,
  PROCESS_QUERY_TIMEOUT_MS,
  WEBKIT_HELPER_EXECUTABLES,
} from "./constants/playwright-processes.js";

const execFileAsync = promisify(execFile);

/**
 * @typedef {object} WebKitProcess
 * @property {number} processId - Process identifier.
 * @property {number} parentProcessId - Identifier of the process that started it, which may no longer exist.
 * @property {string | null} executablePath - Full executable path, or `null` when Windows does not expose it.
 * @property {number | null} startedAtMs - Start time in Unix milliseconds, or `null` when Windows does not expose it.
 */

/**
 * @typedef {object} OrphanCleanupDependencies
 * @property {string} [platform] - Platform name, as `process.platform` reports it.
 * @property {() => Promise<WebKitProcess[]>} [listWebKitProcesses] - Lists the running WebKit helpers.
 * @property {() => Promise<Map<number, number | null>>} [listLiveProcesses] - Lists every running process: its start
 * time in Unix milliseconds (or `null` when unknown), by identifier.
 * @property {(processId: number) => void} [terminateProcess] - Closes one process; throws when it cannot.
 * @property {(message: string) => void} [warn] - Reports a failure without stopping the run.
 */

/**
 * Tells whether an executable lives inside a Playwright browsers folder, whatever the case or separator.
 * @param {string | null} executablePath - Executable path reported by Windows.
 * @returns {boolean} `true` when one of its folders is exactly `ms-playwright`.
 */
function isInsidePlaywrightBrowsersFolder(executablePath) {
  if (!executablePath) return false;
  return executablePath
    .split(/[\\/]/u)
    .some((pathSegment) => pathSegment.toLowerCase() === PLAYWRIGHT_BROWSERS_FOLDER);
}

/**
 * Tells whether the process that started a WebKit helper is still running. A live process that started after the
 * helper reused its parent's identifier, so it is not the parent. When either start time is unknown, the parent is
 * assumed alive and the helper is kept.
 * @param {WebKitProcess} webKitProcess - Running WebKit helper.
 * @param {Map<number, number | null>} liveProcesses - Start time of every running process, by identifier.
 * @returns {boolean} `true` when its parent is running.
 */
function isParentAlive(webKitProcess, liveProcesses) {
  if (!liveProcesses.has(webKitProcess.parentProcessId)) return false;
  const parentStartedAtMs = liveProcesses.get(webKitProcess.parentProcessId);
  if (parentStartedAtMs == null || webKitProcess.startedAtMs == null) return true;
  return parentStartedAtMs <= webKitProcess.startedAtMs;
}

/**
 * Picks the WebKit helpers that a run may close: Playwright's own executables whose parent no longer exists, plus
 * the Playwright helpers started by one of those orphans, whose parent is about to be closed too.
 * @param {WebKitProcess[]} processes - Running WebKit helpers.
 * @param {Map<number, number | null>} liveProcesses - Start time of every running process, by identifier.
 * @returns {number[]} Identifiers of the orphaned Playwright helpers, in input order.
 */
export function selectOrphanedPlaywrightProcessIds(processes, liveProcesses) {
  const playwrightProcesses = processes.filter((webKitProcess) =>
    isInsidePlaywrightBrowsersFolder(webKitProcess.executablePath),
  );
  const orphanedProcessIds = new Set();
  let foundNewOrphan = true;
  while (foundNewOrphan) {
    foundNewOrphan = false;
    for (const playwrightProcess of playwrightProcesses) {
      if (orphanedProcessIds.has(playwrightProcess.processId)) continue;
      if (
        orphanedProcessIds.has(playwrightProcess.parentProcessId) ||
        !isParentAlive(playwrightProcess, liveProcesses)
      ) {
        orphanedProcessIds.add(playwrightProcess.processId);
        foundNewOrphan = true;
      }
    }
  }
  return playwrightProcesses
    .map((playwrightProcess) => playwrightProcess.processId)
    .filter((processId) => orphanedProcessIds.has(processId));
}

/**
 * PowerShell function that turns a CIM `CreationDate` into Unix milliseconds, which survive `ConvertTo-Json` the same
 * way on Windows PowerShell 5.1 and PowerShell 7. Returns `$null` when the date is missing.
 */
const UNIX_MILLISECONDS_FUNCTION =
  "function ConvertTo-UnixMilliseconds($date) { if ($date) { ([DateTimeOffset]$date).ToUnixTimeMilliseconds() } else { $null } }";

/** PowerShell calculated property that adds each process start time, in Unix milliseconds, as `StartedAtMs`. */
const STARTED_AT_MS_PROPERTY = "@{ Name = 'StartedAtMs'; Expression = { ConvertTo-UnixMilliseconds $_.CreationDate } }";

/**
 * Reads a start time from a PowerShell row.
 * @param {unknown} startedAtMs - Value printed for `StartedAtMs`.
 * @returns {number | null} Start time in Unix milliseconds, or `null` when unknown.
 */
function parseStartedAtMs(startedAtMs) {
  return typeof startedAtMs === "number" ? startedAtMs : null;
}

/**
 * Runs a PowerShell query and parses its JSON output as a list.
 * `ConvertTo-Json` prints nothing for no results and a bare object for a single one, so both are normalized.
 * @param {string} command - PowerShell command that ends in `ConvertTo-Json`.
 * @returns {Promise<unknown[]>} Parsed items.
 */
async function queryPowerShellJson(command) {
  const { stdout } = await execFileAsync("powershell", ["-NoProfile", "-NonInteractive", "-Command", command], {
    timeout: PROCESS_QUERY_TIMEOUT_MS,
    windowsHide: true,
  });
  const output = stdout.trim();
  if (!output) return [];
  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? parsed : [parsed];
}

/**
 * Lists the running WebKit helpers through CIM.
 * @returns {Promise<WebKitProcess[]>} Running helpers.
 */
async function listWindowsWebKitProcesses() {
  const nameFilter = WEBKIT_HELPER_EXECUTABLES.map((executableName) => `Name='${executableName}'`).join(" OR ");
  const rows = await queryPowerShellJson(
    `${UNIX_MILLISECONDS_FUNCTION}; Get-CimInstance Win32_Process -Filter "${nameFilter}" | Select-Object ProcessId,ParentProcessId,ExecutablePath,${STARTED_AT_MS_PROPERTY} | ConvertTo-Json -Compress`,
  );
  return rows.map((row) => {
    const { ProcessId, ParentProcessId, ExecutablePath, StartedAtMs } = /** @type {Record<string, unknown>} */ (row);
    return {
      processId: Number(ProcessId),
      parentProcessId: Number(ParentProcessId),
      executablePath: typeof ExecutablePath === "string" ? ExecutablePath : null,
      startedAtMs: parseStartedAtMs(StartedAtMs),
    };
  });
}

/**
 * Lists every running process and its start time through CIM.
 * @returns {Promise<Map<number, number | null>>} Start time in Unix milliseconds of each running process, by identifier.
 */
async function listWindowsLiveProcesses() {
  const rows = await queryPowerShellJson(
    `${UNIX_MILLISECONDS_FUNCTION}; Get-CimInstance Win32_Process | Select-Object ProcessId,${STARTED_AT_MS_PROPERTY} | ConvertTo-Json -Compress`,
  );
  return new Map(
    rows.map((row) => {
      const { ProcessId, StartedAtMs } = /** @type {Record<string, unknown>} */ (row);
      return [Number(ProcessId), parseStartedAtMs(StartedAtMs)];
    }),
  );
}

/**
 * Turns a caught value into a one-line reason for a warning.
 * @param {unknown} error - Caught value.
 * @returns {string} Its message.
 */
function describeError(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Closes the orphaned Playwright WebKit helpers. Does nothing outside Windows, and never fails the run:
 * a failed query or close is reported as a warning.
 * @param {OrphanCleanupDependencies} [dependencies] - System access, replaceable for tests.
 * @returns {Promise<number[]>} Identifiers of the helpers it closed.
 */
export async function cleanOrphanedPlaywrightProcesses({
  platform = process.platform,
  listWebKitProcesses = listWindowsWebKitProcesses,
  listLiveProcesses = listWindowsLiveProcesses,
  // On Windows `process.kill` calls TerminateProcess.
  terminateProcess = (processId) => process.kill(processId),
  warn = console.warn,
} = {}) {
  if (platform !== ORPHAN_CLEANUP_PLATFORM) return [];

  let orphanedProcessIds;
  try {
    const webKitProcesses = await listWebKitProcesses();
    // The usual run finds no helpers, so it skips the full process scan.
    if (!webKitProcesses.length) return [];
    orphanedProcessIds = selectOrphanedPlaywrightProcessIds(webKitProcesses, await listLiveProcesses());
  } catch (error) {
    warn(`playwright-orphan-cleanup:listProcesses failed, skipping cleanup: ${describeError(error)}`);
    return [];
  }

  const closedProcessIds = [];
  for (const processId of orphanedProcessIds) {
    try {
      terminateProcess(processId);
      closedProcessIds.push(processId);
    } catch (error) {
      warn(`playwright-orphan-cleanup:terminateProcess failed for processId ${processId}: ${describeError(error)}`);
    }
  }
  return closedProcessIds;
}

/** Playwright `globalSetup` and `globalTeardown` entry: sweeps orphans from earlier runs and from this one. */
export default async function playwrightOrphanCleanup() {
  await cleanOrphanedPlaywrightProcesses();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const closedProcessIds = await cleanOrphanedPlaywrightProcesses();
  console.log(
    closedProcessIds.length
      ? `playwright-orphan-cleanup: closed ${closedProcessIds.length} orphaned WebKit process(es): ${closedProcessIds.join(", ")}`
      : "playwright-orphan-cleanup: no orphaned WebKit processes closed",
  );
}
