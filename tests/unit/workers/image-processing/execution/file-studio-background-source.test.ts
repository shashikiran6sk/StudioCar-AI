import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";

import { FileStudioBackgroundSource } from "../../../../../workers/image-processing/src/execution/file-studio-background-source";

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "studiocar-backgrounds-"));
});

afterEach(async () => {
  await rm(directory, { force: true, recursive: true });
});

it("reads a background once per runtime and serves later reads from memory", async () => {
  await writeFile(path.join(directory, "grey.png"), "first");
  const source = new FileStudioBackgroundSource(directory);
  expect(Buffer.from(await source.read("grey.png")).toString()).toBe("first");
  await writeFile(path.join(directory, "grey.png"), "second");
  expect(Buffer.from(await source.read("grey.png")).toString()).toBe("first");
});

it("never reads outside its directory", async () => {
  await writeFile(path.join(directory, "grey.png"), "inside");
  const source = new FileStudioBackgroundSource(path.join(directory, "nested"));
  await expect(source.read("../grey.png")).rejects.toThrow();
});

it("tries again after a failed read", async () => {
  const source = new FileStudioBackgroundSource(directory);
  await expect(source.read("late.png")).rejects.toThrow();
  await writeFile(path.join(directory, "late.png"), "now here");
  expect(Buffer.from(await source.read("late.png")).toString()).toBe("now here");
});
