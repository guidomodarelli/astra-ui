/**
 * @module playwright-orphan-cleanup Closes Playwright WebKit helpers left behind by runs that were killed on Windows.
 *
 * When a Playwright run dies abruptly (TerminateProcess, a closed session, an agent timeout), Windows does not kill
 * its children and `globalTeardown` never runs: `WebKitNetworkProcess.exe` and `WebKitWebProcess.exe` stay alive
 * without a parent and keep the repository folder locked as their working directory. Wired as `globalSetup` and
 * `globalTeardown` of the Playwright configurations, and runnable by hand with `pnpm test:browser:cleanup`.
 *
 * It only closes helpers that match both conditions: the executable lives inside an `ms-playwright` folder and its
 * parent process no longer exists. A helper whose parent is alive belongs to a running browser and is never touched.
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
 */

/**
 * @typedef {object} OrphanCleanupDependencies
 * @property {string} [platform] - Platform name, as `process.platform` reports it.
 * @property {() => Promise<WebKitProcess[]>} [listWebKitProcesses] - Lists the running WebKit helpers.
 * @property {() => Promise<Set<number>>} [listLiveProcessIds] - Lists every running process identifier.
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
 * Picks the WebKit helpers that a run may close: Playwright's own executables whose parent no longer exists.
 * @param {WebKitProcess[]} processes - Running WebKit helpers.
 * @param {Set<number>} liveProcessIds - Identifiers of every running process.
 * @returns {number[]} Identifiers of the orphaned Playwright helpers, in input order.
 */
export function selectOrphanedPlaywrightProcessIds(processes, liveProcessIds) {
  return processes
    .filter((webKitProcess) => isInsidePlaywrightBrowsersFolder(webKitProcess.executablePath))
    .filter((webKitProcess) => !liveProcessIds.has(webKitProcess.parentProcessId))
    .map((webKitProcess) => webKitProcess.processId);
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
    `Get-CimInstance Win32_Process -Filter "${nameFilter}" | Select-Object ProcessId,ParentProcessId,ExecutablePath | ConvertTo-Json -Compress`,
  );
  return rows.map((row) => {
    const { ProcessId, ParentProcessId, ExecutablePath } = /** @type {Record<string, unknown>} */ (row);
    return {
      processId: Number(ProcessId),
      parentProcessId: Number(ParentProcessId),
      executablePath: typeof ExecutablePath === "string" ? ExecutablePath : null,
    };
  });
}

/**
 * Lists every running process identifier through CIM.
 * @returns {Promise<Set<number>>} Running process identifiers.
 */
async function listWindowsLiveProcessIds() {
  const processIds = await queryPowerShellJson(
    "Get-CimInstance Win32_Process | Select-Object -ExpandProperty ProcessId | ConvertTo-Json -Compress",
  );
  return new Set(processIds.map(Number));
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
  listLiveProcessIds = listWindowsLiveProcessIds,
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
    orphanedProcessIds = selectOrphanedPlaywrightProcessIds(webKitProcesses, await listLiveProcessIds());
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
