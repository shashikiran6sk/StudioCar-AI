import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { calculateSha256 } from "../execution/calculate-sha256";
import { isMissingS3ObjectError } from "../storage/is-missing-s3-object-error";
import { listStudioAssetKeys } from "./list-studio-asset-keys";
import { studioAssetContentType } from "./studio-asset-content-type";
import {
  CHANGED_STUDIO_ASSET_MESSAGE,
  STUDIO_ASSET_CHECKSUM_METADATA_KEY,
} from "./studio-asset-sync.constants";
import type {
  StudioAssetSyncClient,
  StudioAssetSyncResult,
  SyncStudioAssetsInput,
} from "./sync-studio-assets.types";

async function storedChecksum(
  client: StudioAssetSyncClient,
  bucket: string,
  objectKey: string,
): Promise<string | null> {
  try {
    const head = await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: objectKey }),
    );
    return head.Metadata?.[STUDIO_ASSET_CHECKSUM_METADATA_KEY] ?? "";
  } catch (error) {
    if (isMissingS3ObjectError(error)) return null;
    throw error;
  }
}

/**
 * Publishes every processing asset under its deterministic key.
 *
 * Only the registry's own keys are written, so no other object in the bucket
 * is touched. An identical asset is skipped. A different asset under the same
 * versioned key is refused unless `replace` is set, because workers cache
 * these keys as immutable.
 */
export async function syncStudioAssets(
  input: SyncStudioAssetsInput,
): Promise<StudioAssetSyncResult[]> {
  const results: StudioAssetSyncResult[] = [];
  for (const objectKey of listStudioAssetKeys()) {
    const contentType = studioAssetContentType(objectKey);
    const bytes = await input.readAsset(objectKey);
    const checksum = calculateSha256(bytes);
    const stored = await storedChecksum(input.client, input.bucket, objectKey);
    if (stored === checksum) {
      results.push({ objectKey, outcome: "UNCHANGED" });
      continue;
    }
    if (stored !== null && !input.replace) {
      throw new Error(`${CHANGED_STUDIO_ASSET_MESSAGE} ${objectKey}`);
    }

    await input.client.send(
      new PutObjectCommand({
        Body: bytes,
        Bucket: input.bucket,
        ContentLength: bytes.byteLength,
        ContentType: contentType,
        Key: objectKey,
        Metadata: { [STUDIO_ASSET_CHECKSUM_METADATA_KEY]: checksum },
      }),
    );
    results.push({ objectKey, outcome: stored === null ? "UPLOADED" : "REPLACED" });
  }
  return results;
}
