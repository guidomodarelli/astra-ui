/**
 * @file Configuration of `beez-rp create-version` (`pnpm create-version`, alias `pnpm cv`) for beez-ui.
 *
 * The shared command diagnoses the repository, requires entries in the changelog
 * `[Unreleased]` block (drafted by Claude Code, then Codex, when they are missing;
 * see `changelogDraft`), bumps the version (commit `X.Y.Z` + annotated tag `vX.Y.Z`,
 * renaming `[Unreleased]` to the dated version in that commit),
 * prepares, pushes `main` and the tag atomically and publishes. beez-ui
 * prepares a checksum-addressed tarball through `scripts/release-hooks.js`;
 * the engine verifies that exact tarball (SHA-256 and contents) and publishes
 * it to npm through trusted publishing (OIDC) from the Release workflow, without
 * an npm token. There are no separate checks because
 * `release:prepare` already runs the full validation on the version commit.
 */
import { prepareReleaseArtifact } from "./scripts/release-hooks.js";

/** @type {import("beez-rp/create-version").CreateVersionConfig} */
export default {
  projectName: "beez-ui",
  // Dates the `## [X.Y.Z] - YYYY-MM-DD` changelog heading in Argentina time instead of the runner's UTC day.
  releaseTimeZone: "America/Argentina/Buenos_Aires",
  // Drafts missing `[Unreleased]` entries with Claude Code, then Codex, before a local release stops for them.
  changelogDraft: true,
  releaseTypeDescriptions: {
    patch: "Solo arreglos o cambios internos; nada nuevo para quien consume el paquete.",
    minor: "Funcionalidades nuevas compatibles; lo existente sigue funcionando igual.",
    major: "Cambios incompatibles: quien consume el paquete tiene que adaptar su código.",
  },
  // release:prepare already runs the full validation on the version commit, so it is not repeated before the bump.
  checks: false,
  // `pnpm cv` bumps and pushes locally; .github/workflows/release.yml receives version, tag and sha and runs `--ci-release`.
  ci: { workflow: "release.yml" },
  prepare: prepareReleaseArtifact,
  publish: "npm",
  publication: { authentication: "oidc" },
  artifact: "releases/{version}-{sha256}/{name}-{version}.tgz",
  summary: ["Consumidores: pnpm add beez-ui@^{version}"],
};
