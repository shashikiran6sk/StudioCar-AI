import { Buffer } from "node:buffer";
import { log } from "node:console";
import process from "node:process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { build } from "esbuild";
import sharp from "sharp";

const LEGACY_SHADOW = { opacity: 0.38, blurRatio: 0.035, raiseRatio: 0.02, widthRatio: 0.47, depthRatio: 0.06 };

const [
  originalPath,
  cleanCutoutPath,
  outputDirectory,
  previousCutoutPath = cleanCutoutPath,
] = process.argv.slice(2);
if (!originalPath || !cleanCutoutPath || !outputDirectory) {
  throw new Error(
    "Usage: pnpm shadow:diagnostics <original> <clean-provider-cutout> <output-directory> [previous-provider-cutout]",
  );
}
const temporary = await mkdtemp(path.join(tmpdir(), "studiocar-shadow-"));
try {
  const bundle = path.join(temporary, "diagnostics.mjs");
  await build({
    stdin: {
      contents:
        'export { readVehicleAlpha } from "./src/execution/read-vehicle-alpha"; export { createVehicleShadow } from "./src/execution/create-vehicle-shadow"; export { createStudioSceneSvg } from "./src/execution/create-studio-scene-svg"; export { STUDIO_SCENE_PALETTES } from "./src/execution/studio-scene.constants";',
      resolveDir: process.cwd(),
      loader: "ts",
    },
    bundle: true,
    platform: "node",
    format: "esm",
    external: ["sharp"],
    outfile: bundle,
  });
  // A bundle in /tmp cannot resolve workspace dependencies directly.
  const source = await readFile(bundle, "utf8");
  await writeFile(
    bundle,
    source.replaceAll(
      'from "sharp"',
      `from ${JSON.stringify(import.meta.resolve("sharp"))}`,
    ),
  );
  const {
    readVehicleAlpha,
    createVehicleShadow,
    createStudioSceneSvg,
    STUDIO_SCENE_PALETTES,
  } = await import(bundle);
  await mkdir(outputDirectory, { recursive: true });
  const clean = await sharp(cleanCutoutPath).ensureAlpha().png().toBuffer();
  const previous = await sharp(previousCutoutPath)
    .ensureAlpha()
    .png()
    .toBuffer();
  const alpha = await readVehicleAlpha(clean);
  const before = await readVehicleAlpha(previous);
  if (!alpha.subject || !before.subject)
    throw new Error("Diagnostic cutouts must contain a vehicle.");
  if (alpha.width !== before.width || alpha.height !== before.height)
    throw new Error("Before/after cutouts must use the same canvas.");
  const backdrop = Buffer.from(
    createStudioSceneSvg({
      canvasWidth: alpha.width,
      canvasHeight: alpha.height,
      palette: STUDIO_SCENE_PALETTES.PREMIUM_WHITE,
      subject: alpha.subject,
    }),
  );
  // Historical ellipse constants from the pre-fix renderer, solely for comparison.
  const { info: previousBounds } = await sharp(previous).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 }).png().toBuffer({ resolveWithObject: true });
  const subject = { left: Math.abs(previousBounds.trimOffsetLeft ?? 0), top: Math.abs(previousBounds.trimOffsetTop ?? 0), width: previousBounds.width, height: previousBounds.height };
  const oldMask = Buffer.from(
    `<svg width="${alpha.width}" height="${alpha.height}"><defs><filter id="soft" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="${Math.max(1, Math.round(subject.height * LEGACY_SHADOW.blurRatio))}"/></filter></defs><ellipse cx="${subject.left + subject.width / 2}" cy="${Math.round(subject.top + subject.height - subject.height * LEGACY_SHADOW.raiseRatio)}" rx="${Math.round(subject.width * LEGACY_SHADOW.widthRatio)}" ry="${Math.max(1, Math.round(subject.height * LEGACY_SHADOW.depthRatio))}" fill="black" fill-opacity="${LEGACY_SHADOW.opacity}" filter="url(#soft)"/></svg>`,
  );
  const newMask = await createVehicleShadow(alpha, "NATURAL");
  if (newMask === null) throw new Error("Diagnostic shadow was empty.");
  await sharp(originalPath)
    .flatten({ background: "white" })
    .jpeg()
    .toFile(path.join(outputDirectory, "01-original.jpg"));
  await sharp(clean)
    .webp({ lossless: true })
    .toFile(path.join(outputDirectory, "02-provider-transparent.webp"));
  await sharp(clean)
    .extractChannel("alpha")
    .png()
    .toFile(path.join(outputDirectory, "03-alpha-mask.png"));
  await sharp(oldMask)
    .png()
    .toFile(path.join(outputDirectory, "04-current-shadow-mask.png"));
  await sharp(backdrop)
    .composite([{ input: oldMask }, { input: previous }])
    .webp({ quality: 95 })
    .toFile(path.join(outputDirectory, "05-current-shadow-composite.webp"));
  await writeFile(
    path.join(outputDirectory, "06-new-shadow-mask.png"),
    newMask,
  );
  await sharp(backdrop)
    .composite([{ input: newMask }, { input: clean }])
    .webp({ quality: 95 })
    .toFile(path.join(outputDirectory, "07-new-shadow-composite.webp"));
  log(
    JSON.stringify({
      width: alpha.width,
      height: alpha.height,
      subject: alpha.subject,
      outputDirectory,
    }),
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
