// Offline visual check using the actual packaged model and the production
// surface fit / renderer. No Leonardo calls or application credentials.
import assert from "node:assert/strict";
import { log } from "node:console";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import sharp from "sharp";
import { bundleEntry, NATIVE_EXTERNALS } from "./bundle.mjs";

const root = process.cwd();
const output = path.resolve(process.argv[2] ?? "../../docs/evidence/plate-branding");
const bundle = path.join(root, "dist/plate-evidence.mjs");
await mkdir(path.dirname(bundle), { recursive: true });
const exported = {
  LocalPlateBranding: "local-plate-branding",
  ForkedPlateDetector: "forked-plate-detector",
  applyPlateOverlay: "apply-plate-overlay",
  createPlateProjection: "create-plate-projection",
};
await build({
  stdin: {
    contents: Object.entries(exported).map(([name, file]) =>
      `export { ${name} } from ${JSON.stringify(path.join(root, "src/plate-branding", `${file}.ts`))};`).join("\n"),
    resolveDir: root, loader: "ts",
  },
  outfile: bundle, bundle: true, platform: "node", target: "node24", format: "esm",
  external: NATIVE_EXTERNALS,
  banner: { js: "import { createRequire } from 'node:module';const require=createRequire(import.meta.url);" },
});
await bundleEntry(path.join(root, "src/plate-branding/plate-detector-child.ts"), path.join(root, "dist/plate-detector.mjs"));
const { LocalPlateBranding, ForkedPlateDetector, applyPlateOverlay, createPlateProjection } = await import(pathToFileURL(bundle).href);
const source = path.resolve(root, "../../tests/fixtures/plate-branding/vehicle-with-plate.png");
const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const original = { channels: 3, data, height: info.height, width: info.width };
const started = performance.now();
const branding = new LocalPlateBranding(new ForkedPlateDetector(path.join(root, "dist/plate-detector.mjs"), 10000), path.join(root, "assets/plate-branding"));
const overlay = await branding.prepare(original);
assert.ok(overlay, "The real plate must produce a reliable surface.");
const branded = applyPlateOverlay(original, overlay, {
  canvasHeight: info.height, canvasWidth: info.width, offsetX: 0, offsetY: 0, scale: 1,
});
assert.notEqual(branded, original);
await mkdir(output, { recursive: true });
const before = await sharp(data, { raw: { channels: 3, height: info.height, width: info.width } }).png().toBuffer();
const after = await sharp(branded.data, { raw: { channels: 3, height: info.height, width: info.width } }).png().toBuffer();
await writeFile(path.join(output, "branded-original.png"), after);
await sharp({ create: { width: info.width * 2, height: info.height, channels: 3, background: "#000000" } })
  .composite([{ input: before, left: 0, top: 0 }, { input: after, left: info.width, top: 0 }])
  .png().toFile(path.join(output, "before-after.png"));
const rectangle = { left: 295, top: 180, width: 105, height: 40 };
const detailBefore = await sharp(before).extract(rectangle).resize({ width: 630 }).png().toBuffer();
const detailAfter = await sharp(after).extract(rectangle).resize({ width: 630 }).png().toBuffer();
await sharp({ create: { width: 1260, height: 240, channels: 3, background: "#000000" } })
  .composite([{ input: detailBefore, left: 0, top: 0 }, { input: detailAfter, left: 630, top: 0 }])
  .png().toFile(path.join(output, "plate-detail.png"));
const project = createPlateProjection(overlay.corners);
assert.ok(project);
let outsidePolygonPixelsChanged = 0;
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
  const uv = project({ x: x + 0.5, y: y + 0.5 });
  if (uv && uv.x >= 0 && uv.x <= 1 && uv.y >= 0 && uv.y <= 1) continue;
  const index = (y * info.width + x) * 3;
  if (!data.subarray(index, index + 3).equals(branded.data.subarray(index, index + 3))) outsidePolygonPixelsChanged++;
}
assert.equal(outsidePolygonPixelsChanged, 0);
const metrics = { corners: overlay.corners, source: { width: info.width, height: info.height }, outsidePolygonPixelsChanged };
await writeFile(path.join(output, "geometry.json"), `${JSON.stringify(metrics, null, 2)}\n`);
log(JSON.stringify({ ok: true, durationMs: performance.now() - started, output }));
