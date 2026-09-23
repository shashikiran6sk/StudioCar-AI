/**
 * Uploads the committed studio processing assets to the configured bucket.
 *
 *   pnpm studio-assets:sync              # upload missing assets
 *   pnpm studio-assets:sync -- --replace # also overwrite changed ones (dev)
 *
 * The bucket and connection come from the same settings the application
 * reads (`apps/web/.env` locally, the deployment's environment otherwise).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { S3Client } from "@aws-sdk/client-s3";
import {
  createS3ClientOptions,
  parseStudioAssetSyncEnvironment,
} from "@studiocar/config";

import { syncStudioAssets } from "../src/studio-assets/sync-studio-assets";
import { findRepositoryRoot } from "./find-repository-root";

const REPLACE_FLAG = "--replace";
const SOURCE_DIRECTORY = "infrastructure";

const parsed = (() => {
  try {
    return parseStudioAssetSyncEnvironment(process.env);
  } catch {
    process.stderr.write(
      "Studio asset sync needs AWS_REGION and S3_BUCKET, plus any S3_* connection settings, in the environment.\n",
    );
    process.exit(1);
  }
})();
const sourceRoot = path.join(findRepositoryRoot(), SOURCE_DIRECTORY);

const results = await syncStudioAssets({
  bucket: parsed.S3_BUCKET,
  client: new S3Client(createS3ClientOptions(parsed)),
  readAsset: (objectKey) => readFile(path.join(sourceRoot, objectKey)),
  replace: process.argv.includes(REPLACE_FLAG),
});
for (const result of results) {
  process.stdout.write(`${result.outcome.padEnd(9)} ${result.objectKey}\n`);
}
