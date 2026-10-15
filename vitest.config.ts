/** Configures real component tests using the same public barrel as consumers. */
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

/**
 * Suites that must share jsdom's timers with the test realm, as consumer apps running the default `threads` pool do:
 * under `vmThreads` jsdom schedules animation frames on the outer realm, so a fake clock can never swallow them.
 */
const SHARED_REALM_SUITES = ["tests/overlays.test.tsx"];

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    projects: [
      {
        extends: true,
        test: {
          name: "components",
          // Reuse environment initialization while preserving a separate VM per test file.
          pool: "vmThreads",
          include: ["tests/**/*.test.{ts,tsx}"],
          exclude: [...configDefaults.exclude, ...SHARED_REALM_SUITES],
        },
      },
      {
        extends: true,
        test: {
          name: "shared-realm",
          pool: "threads",
          include: SHARED_REALM_SUITES,
        },
      },
    ],
  },
});
