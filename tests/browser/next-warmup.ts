/**
 * Compiles every route of the Next test app before any browser navigates to it.
 *
 * `next dev` compiles each route on its first request, and Playwright only waits for the port. On a CI runner that
 * first navigation took up to 23 seconds and the page could still be unstyled 5 seconds after it loaded, which made
 * CSS assertions on Next pages flaky. Turbopack keeps the compiled routes for the whole run, so compiling them once
 * here gives every spec a ready page.
 */
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { NEXT_ORIGIN } from "./ports";

/** App Router directory of the Next test app. */
const NEXT_APP_DIRECTORY = fileURLToPath(new URL("../next-app/app/", import.meta.url));

/** File that turns an App Router folder into a route. */
const NEXT_PAGE_FILE_NAME = "page.tsx";

/**
 * Lists the routes of the Next test app from its `page.tsx` files, so new fixtures are compiled too.
 * @returns Route paths, such as `/` and `/button-recipe`.
 */
function listNextRoutes(): string[] {
  return readdirSync(NEXT_APP_DIRECTORY, { recursive: true, encoding: "utf8" })
    .map((relativePath) => relativePath.replaceAll("\\", "/"))
    .filter((relativePath) => relativePath === NEXT_PAGE_FILE_NAME || relativePath.endsWith(`/${NEXT_PAGE_FILE_NAME}`))
    .map((pagePath) => `/${pagePath.slice(0, -NEXT_PAGE_FILE_NAME.length).replace(/\/$/, "")}`);
}

/** Requests each route one after another, so the compilations do not compete for the CI runner's CPU. */
export default async function warmUpNextRoutes(): Promise<void> {
  for (const route of listNextRoutes()) {
    const url = new URL(route, NEXT_ORIGIN);
    const response = await fetch(url);
    // Reads the body so the server finishes streaming the render before the next route compiles.
    await response.text();
    if (!response.ok) {
      throw new Error(`next-warmup:warmUpNextRoutes failed: GET ${url.href} answered ${response.status} ${response.statusText}`);
    }
  }
}
