// @vitest-environment node
/** Reads and extracts real archives through the system tar, addressed by absolute paths. */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { extractArchive, listArchiveEntries, readArchiveFile } from "../scripts/tarball.js";

const temporaryDirectories: string[] = [];

/** Packs a `package/` folder the way npm lays out its tarballs and returns the archive's absolute path. */
function createPackageArchive(): string {
  const directory = mkdtempSync(join(tmpdir(), "astra-ui-tarball-"));
  temporaryDirectories.push(directory);
  mkdirSync(join(directory, "package"));
  writeFileSync(join(directory, "package", "package.json"), JSON.stringify({ name: "fixture", version: "1.0.0" }));
  execFileSync("tar", ["-czf", "fixture.tgz", "package"], { cwd: directory });
  return join(directory, "fixture.tgz");
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("tarball helpers", () => {
  // On Windows the absolute path starts with a drive letter, which GNU tar reads as a remote `host:path`.
  it("should list the entries of an archive given by its absolute path", () => {
    expect(listArchiveEntries(createPackageArchive())).toEqual(expect.arrayContaining(["package/package.json"]));
  });

  it("should read one file of an archive given by its absolute path", () => {
    expect(JSON.parse(readArchiveFile(createPackageArchive(), "package/package.json"))).toEqual({ name: "fixture", version: "1.0.0" });
  });

  it("should extract an archive given by its absolute path into another directory", () => {
    const archivePath = createPackageArchive();
    const destination = mkdtempSync(join(tmpdir(), "astra-ui-tarball-destination-"));
    temporaryDirectories.push(destination);

    extractArchive(archivePath, destination);

    expect(JSON.parse(readFileSync(join(destination, "package", "package.json"), "utf8")).name).toBe("fixture");
  });
});
