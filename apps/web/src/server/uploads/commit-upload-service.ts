import { SupportedImageMimeTypeSchema } from "@studiocar/contracts";

import { IMAGE_HEADER_READ_BYTES } from "./image-validation/image-validation.constants";
import { toCommitUploadResponse } from "./to-commit-upload-response";
import { INVALID_UPLOAD_INTENT_REASON } from "./upload.constants";
import type {
  CommitUploadResult,
  UploadAssetRepositoryPort,
  UploadObjectStoragePort,
} from "./upload.types";
import { validateStoredUpload } from "./validate-stored-upload";

export interface CommitUploadServiceOptions {
  maximumImageDimension: number;
  maximumImagePixels: number;
  now?: () => Date;
}

export class CommitUploadService {
  private readonly now: () => Date;

  public constructor(
    private readonly assets: UploadAssetRepositoryPort,
    private readonly storage: UploadObjectStoragePort,
    private readonly options: CommitUploadServiceOptions,
  ) {
    this.now = options.now ?? (() => new Date());
  }

  public async execute(
    userId: string,
    assetId: string,
    etag: string | undefined,
  ): Promise<CommitUploadResult> {
    const asset = await this.assets.findOwnedById(userId, assetId);
    if (!asset || asset.status === "DELETED") {
      return { ok: false, reason: "ASSET_NOT_FOUND" };
    }
    const completed = toCommitUploadResponse(asset);
    if (completed) return { ok: true, response: completed };
    if (asset.status === "INVALID") {
      return { ok: false, reason: "ASSET_INVALID" };
    }

    const expectedMimeType = SupportedImageMimeTypeSchema.safeParse(
      asset.mimeType,
    );
    if (!expectedMimeType.success || asset.checksumSha256 === null) {
      await this.assets.markInvalidOwned(
        userId,
        assetId,
        INVALID_UPLOAD_INTENT_REASON,
      );
      return { ok: false, reason: "OBJECT_INVALID" };
    }

    try {
      const object = await this.storage.headObject(asset.originalObjectKey);
      if (!object) return { ok: false, reason: "OBJECT_MISSING" };
      const headerBytes = await this.storage.readObjectPrefix(
        asset.originalObjectKey,
        IMAGE_HEADER_READ_BYTES,
      );
      const validation = validateStoredUpload(
        asset,
        object,
        headerBytes,
        expectedMimeType.data,
        etag,
        this.options.maximumImageDimension,
        this.options.maximumImagePixels,
      );
      if (!validation.valid) {
        await this.assets.markInvalidOwned(
          userId,
          assetId,
          validation.reason,
        );
        return { ok: false, reason: "OBJECT_INVALID" };
      }

      const updated = await this.assets.markUploadedOwned(userId, assetId, {
        width: validation.width,
        height: validation.height,
        uploadedAt: this.now(),
      });
      if (!updated) return { ok: false, reason: "ASSET_NOT_FOUND" };
      const response = toCommitUploadResponse(updated);
      return response
        ? { ok: true, response }
        : { ok: false, reason: "ASSET_INVALID" };
    } catch {
      return { ok: false, reason: "STORAGE_UNAVAILABLE" };
    }
  }
}
