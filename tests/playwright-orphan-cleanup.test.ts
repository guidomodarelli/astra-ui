// @vitest-environment node
/** Decides which leftover Playwright WebKit processes a run may close, and tolerates system failures while closing them. */
import { describe, expect, it } from "vitest";
import {
  cleanOrphanedPlaywrightProcesses,
  selectOrphanedPlaywrightProcessIds,
} from "../scripts/playwright-orphan-cleanup.js";

const PLAYWRIGHT_NETWORK_PROCESS = "C:\\Users\\dev\\AppData\\Local\\ms-playwright\\webkit-2287\\WebKitNetworkProcess.exe";
const PLAYWRIGHT_WEB_PROCESS = "C:\\Users\\dev\\AppData\\Local\\ms-playwright\\webkit-2287\\WebKitWebProcess.exe";
const PLAYWRIGHT_GPU_PROCESS = "C:\\Users\\dev\\AppData\\Local\\ms-playwright\\webkit-2287\\WebKitGPUProcess.exe";
const PLAYWRIGHT_BROWSER_PROCESS = "C:\\Users\\dev\\AppData\\Local\\ms-playwright\\webkit-2287\\Playwright.exe";
const FOREIGN_NETWORK_PROCESS = "C:\\Program Files\\SomeBrowser\\WebKitNetworkProcess.exe";
const CHILD_STARTED_AT_MS = 1_700_000_000_000;
const EARLIER_STARTED_AT_MS = CHILD_STARTED_AT_MS - 60_000;
const LATER_STARTED_AT_MS = CHILD_STARTED_AT_MS + 60_000;

/**
 * Builds the running-process table the selection reads, with every process started before the WebKit helpers.
 * @param processIds - Identifiers of the running processes.
 * @returns Start time of each running process, by identifier.
 */
function liveProcessesStartedEarlier(processIds: number[]): Map<number, number | null> {
  return new Map(processIds.map((processId) => [processId, EARLIER_STARTED_AT_MS]));
}

describe("selectOrphanedPlaywrightProcessIds", () => {
  it("should close a Playwright WebKit process whose parent no longer exists", () => {
    const processes = [
      { processId: 101, parentProcessId: 900, executablePath: PLAYWRIGHT_NETWORK_PROCESS, startedAtMs: CHILD_STARTED_AT_MS },
      { processId: 102, parentProcessId: 901, executablePath: PLAYWRIGHT_WEB_PROCESS, startedAtMs: CHILD_STARTED_AT_MS },
    ];

    expect(selectOrphanedPlaywrightProcessIds(processes, liveProcessesStartedEarlier([1, 101, 102]))).toEqual([101, 102]);
  });

  it("should keep a Playwright WebKit process whose parent is still running", () => {
    const processes = [{ processId: 101, parentProcessId: 900, executablePath: PLAYWRIGHT_NETWORK_PROCESS, startedAtMs: CHILD_STARTED_AT_MS }];

    expect(selectOrphanedPlaywrightProcessIds(processes, liveProcessesStartedEarlier([101, 900]))).toEqual([]);
  });

  it("should keep an orphaned WebKit process whose executable lives outside ms-playwright", () => {
    const processes = [
      { processId: 101, parentProcessId: 900, executablePath: FOREIGN_NETWORK_PROCESS, startedAtMs: CHILD_STARTED_AT_MS },
      { processId: 102, parentProcessId: 901, executablePath: "C:\\tools\\ms-playwright-mirror\\WebKitNetworkProcess.exe", startedAtMs: CHILD_STARTED_AT_MS },
      { processId: 103, parentProcessId: 902, executablePath: null, startedAtMs: CHILD_STARTED_AT_MS },
    ];

    expect(selectOrphanedPlaywrightProcessIds(processes, liveProcessesStartedEarlier([101, 102, 103]))).toEqual([]);
  });

  it("should match the ms-playwright folder regardless of case or separator", () => {
    const processes = [{ processId: 101, parentProcessId: 900, executablePath: "c:/users/dev/appdata/local/MS-PLAYWRIGHT/webkit-1/WebKitWebProcess.exe", startedAtMs: CHILD_STARTED_AT_MS }];

    expect(selectOrphanedPlaywrightProcessIds(processes, liveProcessesStartedEarlier([101]))).toEqual([101]);
  });

  it("should close a WebKit GPU process whose parent no longer exists", () => {
    const processes = [{ processId: 101, parentProcessId: 900, executablePath: PLAYWRIGHT_GPU_PROCESS, startedAtMs: CHILD_STARTED_AT_MS }];

    expect(selectOrphanedPlaywrightProcessIds(processes, liveProcessesStartedEarlier([101]))).toEqual([101]);
  });

  it("should close a helper whose parent identifier was reused by a process started after it", () => {
    const processes = [{ processId: 101, parentProcessId: 900, executablePath: PLAYWRIGHT_NETWORK_PROCESS, startedAtMs: CHILD_STARTED_AT_MS }];
    const liveProcesses = new Map([
      [101, CHILD_STARTED_AT_MS],
      [900, LATER_STARTED_AT_MS],
    ]);

    expect(selectOrphanedPlaywrightProcessIds(processes, liveProcesses)).toEqual([101]);
  });

  it("should keep a helper whose live parent or own start time is unknown", () => {
    const processes = [
      { processId: 101, parentProcessId: 900, executablePath: PLAYWRIGHT_NETWORK_PROCESS, startedAtMs: CHILD_STARTED_AT_MS },
      { processId: 102, parentProcessId: 901, executablePath: PLAYWRIGHT_WEB_PROCESS, startedAtMs: null },
    ];
    const liveProcesses = new Map<number, number | null>([
      [900, null],
      [901, LATER_STARTED_AT_MS],
    ]);

    expect(selectOrphanedPlaywrightProcessIds(processes, liveProcesses)).toEqual([]);
  });

  it("should close an orphaned Playwright browser together with the helpers it started", () => {
    const processes = [
      { processId: 101, parentProcessId: 200, executablePath: PLAYWRIGHT_NETWORK_PROCESS, startedAtMs: CHILD_STARTED_AT_MS },
      { processId: 200, parentProcessId: 900, executablePath: PLAYWRIGHT_BROWSER_PROCESS, startedAtMs: EARLIER_STARTED_AT_MS },
      { processId: 102, parentProcessId: 300, executablePath: PLAYWRIGHT_WEB_PROCESS, startedAtMs: CHILD_STARTED_AT_MS },
      { processId: 300, parentProcessId: 500, executablePath: PLAYWRIGHT_BROWSER_PROCESS, startedAtMs: EARLIER_STARTED_AT_MS },
    ];
    const liveProcesses = new Map([
      [101, CHILD_STARTED_AT_MS],
      [102, CHILD_STARTED_AT_MS],
      [200, EARLIER_STARTED_AT_MS],
      [300, EARLIER_STARTED_AT_MS],
      [500, EARLIER_STARTED_AT_MS - 60_000],
    ]);

    expect(selectOrphanedPlaywrightProcessIds(processes, liveProcesses)).toEqual([101, 200]);
  });

  it("should close nothing when no WebKit process is running", () => {
    expect(selectOrphanedPlaywrightProcessIds([], liveProcessesStartedEarlier([1, 2, 3]))).toEqual([]);
  });
});

describe("cleanOrphanedPlaywrightProcesses", () => {
  it("should do nothing outside Windows", async () => {
    const queriedSystem: string[] = [];

    const closedProcessIds = await cleanOrphanedPlaywrightProcesses({
      platform: "linux",
      listWebKitProcesses: async () => {
        queriedSystem.push("processes");
        return [{ processId: 101, parentProcessId: 900, executablePath: PLAYWRIGHT_NETWORK_PROCESS, startedAtMs: CHILD_STARTED_AT_MS }];
      },
      listLiveProcesses: async () => {
        queriedSystem.push("live");
        return liveProcessesStartedEarlier([101]);
      },
      terminateProcess: () => queriedSystem.push("terminate"),
      warn: () => queriedSystem.push("warn"),
    });

    expect(closedProcessIds).toEqual([]);
    expect(queriedSystem).toEqual([]);
  });

  it("should close only the orphans on Windows and keep going when one of them cannot be closed", async () => {
    const terminatedProcessIds: number[] = [];
    const warnings: string[] = [];

    const closedProcessIds = await cleanOrphanedPlaywrightProcesses({
      platform: "win32",
      listWebKitProcesses: async () => [
        { processId: 101, parentProcessId: 900, executablePath: PLAYWRIGHT_NETWORK_PROCESS, startedAtMs: CHILD_STARTED_AT_MS },
        { processId: 102, parentProcessId: 901, executablePath: PLAYWRIGHT_NETWORK_PROCESS, startedAtMs: CHILD_STARTED_AT_MS },
        { processId: 103, parentProcessId: 500, executablePath: PLAYWRIGHT_WEB_PROCESS, startedAtMs: CHILD_STARTED_AT_MS },
      ],
      listLiveProcesses: async () => liveProcessesStartedEarlier([101, 102, 103, 500]),
      terminateProcess: (processId) => {
        if (processId === 101) throw new Error("Access is denied.");
        terminatedProcessIds.push(processId);
      },
      warn: (message) => warnings.push(message),
    });

    expect(closedProcessIds).toEqual([102]);
    expect(terminatedProcessIds).toEqual([102]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("101");
  });

  it("should warn and close nothing when the process query fails", async () => {
    const warnings: string[] = [];

    const closedProcessIds = await cleanOrphanedPlaywrightProcesses({
      platform: "win32",
      listWebKitProcesses: async () => {
        throw new Error("powershell was not found");
      },
      listLiveProcesses: async () => new Map(),
      terminateProcess: () => {
        throw new Error("must not terminate");
      },
      warn: (message) => warnings.push(message),
    });

    expect(closedProcessIds).toEqual([]);
    expect(warnings).toHaveLength(1);
  });
});
