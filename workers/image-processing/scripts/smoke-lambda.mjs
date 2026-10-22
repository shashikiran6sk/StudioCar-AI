// Smoke-tests an extracted Lambda archive on its target platform. Run it with
// the archive's own Node.js runtime inside the arm64 Lambda image on native
// ARM64 hardware. It loads nothing from outside the archive.
//
// 1. Imports `handler.mjs` and builds the real worker (configuration, Prisma,
//    S3, Leonardo provider, background directory) by invoking the handler
//    with one malformed SQS message. No database or network call is made.
// 2. Loads the packaged sharp, decodes every packaged background and encodes
//    a WebP, proving the native libvips binary runs on this CPU.
// 3. Runs the packaged plate model on a real positive and a blank negative.
//
// Usage: node smoke-lambda.mjs <extracted-archive-directory> <plate-fixture>
import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { Buffer } from "node:buffer";
import { performance } from "node:perf_hooks";
import { setTimeout, clearTimeout } from "node:timers";
import { log } from "node:console";
import { readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const [archiveArgument, fixtureArgument] = process.argv.slice(2);
if (!archiveArgument) {
  throw new Error("Usage: node smoke-lambda.mjs <extracted-archive-directory>");
}
const archive = path.resolve(archiveArgument);
assert.equal(process.arch, "arm64");

// Synthetic production configuration. Nothing here is a credential, and the
// malformed message never reaches the database, S3 or the provider.
Object.assign(process.env, {
  APP_ENV: "production",
  AWS_REGION: "us-east-1",
  // `.invalid` never resolves (RFC 2606), and nothing connects to it.
  DATABASE_URL: "postgresql://smoke:smoke@database.smoke.invalid:5432/smoke?sslmode=require",
  S3_BUCKET: "studiocar-smoke-prod",
  LEONARDO_API_KEY: "smoke-test-placeholder",
  PLATE_BRANDING_ENABLED: "true",
});

const { handler } = await import(pathToFileURL(path.join(archive, "handler.mjs")).href);
assert.equal(typeof handler, "function");
// A message that fails the worker contract is rejected before any database,
// storage or provider call, and handed back to SQS as a batch-item failure.
const SMOKE_MESSAGE_ID = "smoke-test-message";
assert.deepEqual(
  await handler({ Records: [{ messageId: SMOKE_MESSAGE_ID, body: "{}" }] }),
  { batchItemFailures: [{ itemIdentifier: SMOKE_MESSAGE_ID }] },
);

const sharp = createRequire(path.join(archive, "handler.mjs"))("sharp");
const backgrounds = path.join(archive, "assets", "backgrounds");
const files = (await readdir(backgrounds)).filter((file) => file.endsWith(".png")).sort();
assert.equal(files.length, 6);
for (const file of files) {
  const metadata = await sharp(path.join(backgrounds, file)).metadata();
  assert.equal(metadata.width, 3840);
  assert.equal(metadata.height, 2160);
}
const encoded = await sharp(path.join(backgrounds, files[0]))
  .resize({ width: 320 })
  .webp({ quality: 90, smartSubsample: true })
  .toBuffer({ resolveWithObject: true });
assert.equal(encoded.info.format, "webp");

// Run the packaged model in the same disposable native process as production.
// No network, GPU, workspace dependency or provider credential is available.
async function detect(pixels) {
  const started = performance.now();
  return new Promise((resolve, reject) => {
    const child = fork(path.join(archive, "plate-detector.mjs"), [], {
      env: { ORT_DISABLE_TELEMETRY: "1" }, execArgv: ["--max-old-space-size=128"],
      serialization: "advanced", stdio: ["ignore", "ignore", "ignore", "ipc"],
    });
    let result;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, 15000);
    child.once("message", (message) => { result = message; });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      if (code !== 0 || result?.ok !== true) reject(new Error(
        `Packaged plate inference failed: ${JSON.stringify({ code, signal, timedOut })}`,
      ));
      else resolve({ detections: result.detections, durationMs: performance.now() - started });
    });
    child.send({ pixels });
  });
}

const blank = await detect(Buffer.alloc(640 * 640 * 3, 80));
assert.deepEqual(blank.detections, []);
if (!fixtureArgument) throw new Error("A real-photo plate fixture is required.");
const pixels = await sharp(path.resolve(fixtureArgument)).removeAlpha()
  .resize(640, 640, { fit: "fill" }).raw().toBuffer();
const plate = await detect(pixels);
assert.ok(plate.detections.some((box) => box.left > 0.57 && box.left < 0.62 && box.top > 0.55 && box.top < 0.6 &&
  box.width > 0.12 && box.width < 0.2 && box.height > 0.04 && box.height < 0.09));
const logo = await sharp(path.join(archive, "assets/plate-branding/dealersdrive-logo.png")).metadata();
assert.ok(logo.width > logo.height);

log(
  JSON.stringify({
    ok: true,
    arch: process.arch,
    node: process.version,
    vips: sharp.versions.vips,
    sharp: sharp.versions.sharp,
    backgrounds: files.length,
    plateDetector: { positiveMs: plate.durationMs, negativeMs: blank.durationMs },
  }),
);
