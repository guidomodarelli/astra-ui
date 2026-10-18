/** @module constants/playwright-processes Identifies the Playwright WebKit helper processes that can outlive a killed run. */

/** Only Windows leaves these helpers behind: killing a process there does not kill its children. */
export const ORPHAN_CLEANUP_PLATFORM = "win32";

/**
 * Executables of Playwright's WebKit build on Windows: the browser (`Playwright.exe`) and the helpers it spawns.
 * The browser is included because an orphaned one stays alive as its helpers' parent and keeps them from being closed.
 */
export const WEBKIT_HELPER_EXECUTABLES = [
  "Playwright.exe",
  "WebKitGPUProcess.exe",
  "WebKitNetworkProcess.exe",
  "WebKitWebProcess.exe",
];

/** Folder that holds the browsers Playwright downloads (`%LOCALAPPDATA%\ms-playwright` by default). */
export const PLAYWRIGHT_BROWSERS_FOLDER = "ms-playwright";

/** Upper bound for each PowerShell query, so a stuck query never stalls the test run. */
export const PROCESS_QUERY_TIMEOUT_MS = 30_000;
