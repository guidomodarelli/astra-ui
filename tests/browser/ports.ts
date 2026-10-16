/**
 * Ports of the browser test servers. `BEEZ_BROWSER_PORT` and `BEEZ_NEXT_PORT` let several
 * checkouts (for example parallel worktrees) run the suite at the same time without colliding.
 */
const DEFAULT_VITE_PORT = 3108;
const DEFAULT_NEXT_PORT = 3109;

/** Reads a port from the environment, falling back to the default when it is unset or invalid. */
function readPort(environmentValue: string | undefined, defaultPort: number): number {
  const parsedPort = Number(environmentValue);
  return Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : defaultPort;
}

/** Port of the Vite server that serves the browser fixtures. */
export const VITE_PORT = readPort(process.env.BEEZ_BROWSER_PORT, DEFAULT_VITE_PORT);

/** Port of the Next.js app that exercises the framework adapters. */
export const NEXT_PORT = readPort(process.env.BEEZ_NEXT_PORT, DEFAULT_NEXT_PORT);

/** Origin of the Next.js test app. */
export const NEXT_ORIGIN = `http://127.0.0.1:${NEXT_PORT}`;
