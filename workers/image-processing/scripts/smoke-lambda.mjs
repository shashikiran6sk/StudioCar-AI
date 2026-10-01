// Smoke-tests an extracted Lambda archive on its target platform. Run it with
// the archive's own Node.js runtime (for example inside the arm64 Lambda image
// under QEMU). It loads nothing from outside the archive.
//
// 1. Imports `handler.mjs` and builds the real worker (configuration, Prisma,
//    S3, Leonardo provider, background directory) by invoking the handler
//    with one malformed SQS message. No database or network call is made.
// 2. Loads the packaged sharp, decodes every packaged background and encodes
//    a WebP, proving the native libvips binary runs on this CPU.
//
// Usage: node smoke-lambda.mjs <extracted-archive-directory>
import assert from "node:assert/strict";
import { log } from "node:console";
import { readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const [archiveArgument] = process.argv.slice(2);
if (!archiveArgument) {
  throw new Error("Usage: node smoke-lambda.mjs <extracted-archive-directory>");
}
const archive = path.resolve(archiveArgument);

// Synthetic production configuration. Nothing here is a credential, and the
// malformed message never reaches the database, S3 or the provider.
Object.assign(process.env, {
  APP_ENV: "production",
  AWS_REGION: "us-east-1",
  // `.invalid` never resolves (RFC 2606), and nothing connects to it.
  DATABASE_URL: "postgresql://smoke:smoke@database.smoke.invalid:5432/smoke?sslmode=require",
  S3_BUCKET: "studiocar-smoke-prod",
  LEONARDO_API_KEY: "smoke-test-placeholder",
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

log(
  JSON.stringify({
    ok: true,
    arch: process.arch,
    node: process.version,
    vips: sharp.versions.vips,
    sharp: sharp.versions.sharp,
    backgrounds: files.length,
  }),
);
