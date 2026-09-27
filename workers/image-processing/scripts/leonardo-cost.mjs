import process from "node:process";
import { log } from "node:console";
import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Build a development entry only; it is never imported by the Lambda handler.
const worker = path.resolve(import.meta.dirname, "..");
const outfile = path.join(worker, "dist/leonardo-cost.mjs");
await mkdir(path.dirname(outfile), { recursive: true });
await build({
  stdin: {
    contents: `
      import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
      import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
      import { AppEnvironment, createS3ClientOptions, parseImageWorkerEnvironment } from "@studiocar/config";
      import { LEONARDO_SOURCE_URL_TTL_SECONDS } from "./src/providers/leonardo-provider.constants";
      import { measureLeonardoCost } from "./src/development/measure-leonardo-cost";
      export async function run(sourceObjectKey: string) {
        const environment = parseImageWorkerEnvironment({ ...process.env, BACKGROUND_REMOVAL_PROVIDER: "leonardo" });
        if (environment.APP_ENV !== AppEnvironment.Development) throw new Error("Cost experiment requires APP_ENV=development.");
        if (!environment.LEONARDO_API_KEY) throw new Error("LEONARDO_API_KEY is required.");
        const s3 = new S3Client(createS3ClientOptions(environment));
        return measureLeonardoCost(sourceObjectKey, {
          apiKey: environment.LEONARDO_API_KEY,
          maximumOutputBytes: environment.MAX_PROVIDER_OUTPUT_BYTES,
          maximumPixels: environment.MAX_WORKER_IMAGE_PIXELS,
          timeoutMilliseconds: environment.LEONARDO_TIMEOUT_MS,
        }, (key) => getSignedUrl(s3, new GetObjectCommand({ Bucket: environment.S3_BUCKET, Key: key }), { expiresIn: LEONARDO_SOURCE_URL_TTL_SECONDS }));
      }
    `,
    resolveDir: worker,
    sourcefile: "leonardo-cost-entry.ts",
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  outfile,
  external: ["sharp", "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
});
const sourceKey = process.argv[2];
const reportPath = process.argv[3];
if (!sourceKey || !reportPath)
  throw new Error(
    "Usage: pnpm cost:leonardo <development-source-object-key> <report.json>",
  );
const { run } = await import(pathToFileURL(outfile).href);
const measurements = await run(sourceKey);
await writeFile(reportPath, JSON.stringify(measurements, null, 2) + "\n");
log(JSON.stringify(measurements, null, 2));
