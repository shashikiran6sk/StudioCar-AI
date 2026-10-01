// Builds the image-processing Lambda archive reproducibly:
//
//   handler.mjs                  one esbuild bundle of src/handler.ts
//   node_modules/sharp, @img/…   sharp and its Linux arm64 (glibc) binaries,
//                                exactly as pinned by pnpm-lock.yaml
//   assets/backgrounds/*.png     the six studio backgrounds
//
// The archive is written with sorted entries, one fixed timestamp and fixed
// permissions, so its SHA-256 identifies its contents. A manifest beside it
// records the sizes, the largest entries and the checksum.
//
// Usage, from workers/image-processing:
//   pnpm package:lambda [output-directory]       (default: dist/lambda)
import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { log } from "node:console";
import { existsSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

import { bundleEntry, NATIVE_EXTERNALS } from "./bundle.mjs";
import { writeDeterministicZip } from "./write-deterministic-zip.mjs";

const WORKER_DIRECTORY = process.cwd();
const PACKAGE_NAME = "@studiocar/image-processing-worker";
const ARCHIVE_NAME = "image-processing-worker.zip";
const MANIFEST_NAME = "image-processing-worker.manifest.json";
const TARGET = { os: "linux", cpu: "arm64", libc: "glibc" };
const ASSET_DIRECTORY = "assets/backgrounds";
/** Lambda's limit for an unzipped deployment package. */
const LAMBDA_UNZIPPED_LIMIT_BYTES = 250 * 1024 * 1024;
/** ELF e_machine for AArch64. */
const ELF_MACHINE_AARCH64 = 0xb7;
/**
 * Files never needed at runtime, wherever they appear in a dependency. Nested
 * `node_modules` hold pnpm's links and `.bin` shims, which embed absolute
 * build paths; every runtime dependency is flattened to the top level instead.
 */
const EXCLUDED_FILE = /(?:^|\/)node_modules\/|(?:^|\/)(?:README|CHANGELOG|HISTORY)(?:\.[a-z]+)?$|\.(?:md|markdown|d\.ts|d\.mts|d\.cts|map|ts)$/i;

const outputDirectory = path.resolve(
  process.argv[2] ?? path.join(WORKER_DIRECTORY, "dist", "lambda"),
);

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const resolved = entry.isSymbolicLink() ? await stat(absolute) : entry;
    if (resolved.isDirectory()) {
      files.push(...(await listFiles(absolute, relative)));
    } else if (resolved.isFile()) {
      files.push({ absolute, relative });
    }
  }
  return files;
}

/** Node's resolution of `name` from a real package directory. */
function findPackage(fromDirectory, name) {
  let directory = fromDirectory;
  for (;;) {
    const candidate = path.join(directory, "node_modules", name);
    if (existsSync(path.join(candidate, "package.json"))) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

/**
 * The runtime closure of the native externals in a deployed tree, flattened
 * to `node_modules/<name>` without symlinks (a Lambda ZIP cannot carry the
 * pnpm virtual store's links). Optional dependencies absent for the target
 * platform are skipped; any other missing dependency fails the build.
 */
async function collectNativeDependencies(deployDirectory) {
  const packages = new Map();
  const visit = async (name, fromDirectory, optional) => {
    if (packages.has(name)) return;
    const located = findPackage(fromDirectory, name);
    if (located === null) {
      if (optional) return;
      throw new Error(`Missing runtime dependency ${name}.`);
    }
    const directory = await realpath(located);
    const manifest = JSON.parse(
      await readFile(path.join(directory, "package.json"), "utf8"),
    );
    packages.set(name, { directory, version: manifest.version });
    for (const dependency of Object.keys(manifest.dependencies ?? {})) {
      await visit(dependency, directory, false);
    }
    for (const dependency of Object.keys(manifest.optionalDependencies ?? {})) {
      await visit(dependency, directory, true);
    }
  };
  for (const name of NATIVE_EXTERNALS) await visit(name, deployDirectory, false);
  return packages;
}

function readElfMachine(bytes) {
  const isElf =
    bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46;
  return isElf ? Buffer.from(bytes).readUInt16LE(18) : null;
}

async function main() {
  const temporary = await mkdtemp(path.join(tmpdir(), "studiocar-lambda-"));
  try {
    const files = [];

    const bundlePath = path.join(temporary, "handler.mjs");
    const bundle = await bundleEntry(
      path.join(WORKER_DIRECTORY, "src", "handler.ts"),
      bundlePath,
    );
    files.push({ path: "handler.mjs", bytes: await readFile(bundlePath) });

    // `pnpm deploy` installs the production dependencies (sharp alone) for
    // the Lambda platform from the lockfile, into a directory outside the
    // workspace; the workspace's own install is untouched.
    const deployDirectory = path.join(temporary, "deploy");
    execFileSync(
      "pnpm",
      [
        "--filter",
        PACKAGE_NAME,
        "deploy",
        "--prod",
        "--frozen-lockfile",
        `--os=${TARGET.os}`,
        `--cpu=${TARGET.cpu}`,
        `--libc=${TARGET.libc}`,
        deployDirectory,
      ],
      { cwd: WORKER_DIRECTORY, stdio: ["ignore", "ignore", "inherit"] },
    );
    const nativePackages = await collectNativeDependencies(deployDirectory);
    const nativeBinaries = [];
    for (const [name, { directory }] of nativePackages) {
      for (const file of await listFiles(directory)) {
        if (EXCLUDED_FILE.test(file.relative)) continue;
        const bytes = await readFile(file.absolute);
        const machine = readElfMachine(bytes);
        if (machine !== null) {
          if (machine !== ELF_MACHINE_AARCH64) {
            throw new Error(`${name}/${file.relative} is not an arm64 binary.`);
          }
          nativeBinaries.push(`node_modules/${name}/${file.relative}`);
        }
        files.push({ path: `node_modules/${name}/${file.relative}`, bytes });
      }
    }
    if (!nativeBinaries.some((file) => file.endsWith(".node"))) {
      throw new Error("No arm64 sharp addon was packaged.");
    }

    for (const file of await listFiles(path.join(WORKER_DIRECTORY, ASSET_DIRECTORY))) {
      files.push({
        path: `${ASSET_DIRECTORY}/${file.relative}`,
        bytes: await readFile(file.absolute),
      });
    }

    const archive = writeDeterministicZip(files);
    const uncompressedBytes = files.reduce((sum, file) => sum + file.bytes.byteLength, 0);
    if (uncompressedBytes > LAMBDA_UNZIPPED_LIMIT_BYTES) {
      throw new Error("The unzipped package exceeds Lambda's 250 MB limit.");
    }
    const byPackage = new Map();
    for (const file of files) {
      const match = /^node_modules\/((?:@[^/]+\/)?[^/]+)\//.exec(file.path);
      const key = match ? match[1] : file.path.startsWith(ASSET_DIRECTORY) ? ASSET_DIRECTORY : file.path;
      byPackage.set(key, (byPackage.get(key) ?? 0) + file.bytes.byteLength);
    }
    const bundledInputs = new Map();
    for (const output of Object.values(bundle.metafile.outputs)) {
      for (const [input, { bytesInOutput }] of Object.entries(output.inputs)) {
        const match = /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/.exec(input);
        const key = match ? match[1] : input.replace(/^(?:\.\.\/)+/, "").split("/").slice(0, 2).join("/");
        bundledInputs.set(key, (bundledInputs.get(key) ?? 0) + bytesInOutput);
      }
    }
    const top = (map, count) =>
      [...map]
        .sort((left, right) => right[1] - left[1] || (left[0] < right[0] ? -1 : 1))
        .slice(0, count)
        .map(([name, bytes]) => ({ name, bytes }));

    const manifest = {
      archive: ARCHIVE_NAME,
      target: TARGET,
      sha256: createHash("sha256").update(archive).digest("hex"),
      zipBytes: archive.byteLength,
      uncompressedBytes,
      files: files.length,
      handlerBytes: files[0].bytes.byteLength,
      nativePackages: Object.fromEntries(
        [...nativePackages].map(([name, { version }]) => [name, version]).sort(),
      ),
      nativeBinaries: nativeBinaries.sort(),
      largestPackageEntries: top(byPackage, 10),
      largestBundledModules: top(bundledInputs, 10),
    };
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(path.join(outputDirectory, ARCHIVE_NAME), archive);
    await writeFile(
      path.join(outputDirectory, MANIFEST_NAME),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    log(JSON.stringify(manifest, null, 2));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

await main();
