// @vitest-environment node
/** Decides which leftover Playwright WebKit processes a run may close, and tolerates system failures while closing them. */
import { describe, expect, it } from "vitest";
import {
  cleanOrphanedPlaywrightProcesses,
  selectOrphanedPlaywrightProcessIds,
} from "../scripts/playwright-orphan-cleanup.js";

const PLAYWRIGHT_NETWORK_PROCESS = "C:\\Users\\dev\\AppData\\Local\\ms-playwright\\webkit-2287\\WebKitNetworkProcess.exe";
const PLAYWRIGHT_WEB_PROCESS = "C:\\Users\\dev\\AppData\\Local\\ms-playwright\\webkit-2287\\WebKitWebProcess.exe";
const FOREIGN_NETWORK_PROCESS = "C:\\Program Files\\SomeBrowser\\WebKitNetworkProcess.exe";

describe("selectOrphanedPlaywrightProcessIds", () => {
  it("should close a Playwright WebKit process whose parent no longer exists", () => {
    const processes = [
      { processId: 101, parentProcessId: 900, executablePath: PLAYWRIGHT_NETWORK_PROCESS },
      { processId: 102, parentProcessId: 901, executablePath: PLAYWRIGHT_WEB_PROCESS },
    ];

    expect(selectOrphanedPlaywrightProcessIds(processes, new Set([1, 101, 102]))).toEqual([101, 102]);
  });

  it("should keep a Playwright WebKit process whose parent is still running", () => {
    const processes = [{ processId: 101, parentProcessId: 900, executablePath: PLAYWRIGHT_NETWORK_PROCESS }];

    expect(selectOrphanedPlaywrightProcessIds(processes, new Set([101, 900]))).toEqual([]);
  });

  it("should keep an orphaned WebKit process whose executable lives outside ms-playwright", () => {
    const processes = [
      { processId: 101, parentProcessId: 900, executablePath: FOREIGN_NETWORK_PROCESS },
      { processId: 102, parentProcessId: 901, executablePath: "C:\\tools\\ms-playwright-mirror\\WebKitNetworkProcess.exe" },
      { processId: 103, parentProcessId: 902, executablePath: null },
    ];

    expect(selectOrphanedPlaywrightProcessIds(processes, new Set([101, 102, 103]))).toEqual([]);
  });

  it("should match the ms-playwright folder regardless of case or separator", () => {
    const processes = [{ processId: 101, parentProcessId: 900, executablePath: "c:/users/dev/appdata/local/MS-PLAYWRIGHT/webkit-1/WebKitWebProcess.exe" }];

    expect(selectOrphanedPlaywrightProcessIds(processes, new Set([101]))).toEqual([101]);
  });

  it("should close nothing when no WebKit process is running", () => {
    expect(selectOrphanedPlaywrightProcessIds([], new Set([1, 2, 3]))).toEqual([]);
  });
});

describe("cleanOrphanedPlaywrightProcesses", () => {
  it("should do nothing outside Windows", async () => {
    const queriedSystem: string[] = [];

    const closedProcessIds = await cleanOrphanedPlaywrightProcesses({
      platform: "linux",
      listWebKitProcesses: async () => {
        queriedSystem.push("processes");
        return [{ processId: 101, parentProcessId: 900, executablePath: PLAYWRIGHT_NETWORK_PROCESS }];
      },
      listLiveProcessIds: async () => {
        queriedSystem.push("live");
        return new Set([101]);
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
        { processId: 101, parentProcessId: 900, executablePath: PLAYWRIGHT_NETWORK_PROCESS },
        { processId: 102, parentProcessId: 901, executablePath: PLAYWRIGHT_NETWORK_PROCESS },
        { processId: 103, parentProcessId: 500, executablePath: PLAYWRIGHT_WEB_PROCESS },
      ],
      listLiveProcessIds: async () => new Set([101, 102, 103, 500]),
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
      listLiveProcessIds: async () => new Set(),
      terminateProcess: () => {
        throw new Error("must not terminate");
      },
      warn: (message) => warnings.push(message),
    });

    expect(closedProcessIds).toEqual([]);
    expect(warnings).toHaveLength(1);
  });
});
