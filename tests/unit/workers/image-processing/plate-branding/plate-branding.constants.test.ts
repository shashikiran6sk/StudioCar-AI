import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { expect, it } from "vitest";
import { PLATE_BRANDING_DIRECTORY, PLATE_LOGO_FILE, PLATE_MODEL_FILE, PLATE_MODEL_SHA256 } from "../../../../../workers/image-processing/src/plate-branding/plate-branding.constants";

it("ships the exact pinned model and supplied wordmark with license and attribution", async () => {
  const directory = path.resolve(process.cwd(), PLATE_BRANDING_DIRECTORY);
  expect(createHash("sha256").update(await readFile(path.join(directory, PLATE_MODEL_FILE))).digest("hex")).toBe(PLATE_MODEL_SHA256);
  const logo = await readFile(path.join(directory, PLATE_LOGO_FILE));
  expect(createHash("sha256").update(logo).digest("hex")).toBe("ca042b68b3cfc7f78e1f211c18fab5fc19feecae1ab1d0e2a14e1991355c7a80");
  expect((await sharp(logo).metadata()).format).toBe("png");
  expect(await readFile(path.join(directory, "NOTICE.txt"), "utf8")).toContain("aecb24a78e31cea03f59b83156d55dde84f20d94");
  expect(await readFile(path.join(directory, "LICENSE-APACHE-2.0.txt"), "utf8")).toContain("Apache License");
});
