/**
 * @module tarball Reads and extracts package archives with the system `tar`.
 *
 * `tar` runs from the archive's own directory and receives only relative paths: GNU tar (the one Git Bash
 * puts first on Windows) rejects absolute `C:\…` paths, reading an archive name as a remote `host:path`,
 * while the Windows `tar` and the Unix ones accept either form.
 */
import { execFileSync } from "node:child_process";
import { basename, dirname, relative, resolve, sep } from "node:path";

/**
 * Runs `tar` against an archive from the archive's own directory.
 * @param {string} archivePath - Path to the archive.
 * @param {string[]} leadingArguments - Mode flags placed before the archive name, such as `-tf`.
 * @param {string[]} [trailingArguments] - Arguments placed after the archive name.
 * @returns {string} Standard output of `tar`.
 */
function runTar(archivePath, leadingArguments, trailingArguments = []) {
  const absoluteArchivePath = resolve(archivePath);
  return execFileSync("tar", [...leadingArguments, basename(absoluteArchivePath), ...trailingArguments], {
    cwd: dirname(absoluteArchivePath),
    encoding: "utf8",
  });
}

/**
 * Lists the entries of an archive.
 * @param {string} archivePath - Path to the archive.
 * @returns {string[]} Entry paths, such as `package/package.json`.
 */
export function listArchiveEntries(archivePath) {
  return runTar(archivePath, ["-tf"]).trim().split(/\r?\n/u);
}

/**
 * Reads one file of an archive without extracting the rest.
 * @param {string} archivePath - Path to the archive.
 * @param {string} entry - Entry path inside the archive.
 * @returns {string} File contents.
 */
export function readArchiveFile(archivePath, entry) {
  return runTar(archivePath, ["-xOf"], [entry]);
}

/**
 * Extracts an archive into a directory.
 * @param {string} archivePath - Path to the archive.
 * @param {string} destination - Existing directory that receives the entries.
 */
export function extractArchive(archivePath, destination) {
  const archiveDirectory = dirname(resolve(archivePath));
  // Forward slashes: launched from a native process, MSYS tar drops backslashes from its arguments.
  const relativeDestination = relative(archiveDirectory, resolve(destination)).split(sep).join("/") || ".";
  runTar(archivePath, ["-xf"], ["-C", relativeDestination]);
}
