import { randomUUID } from "node:crypto";
import type { CreateUploadIntent } from "@studiocar/contracts";

import { buildOriginalObjectKey } from "./build-original-object-key";
import {
  ASSET_ID_METADATA_KEY,
  UPLOAD_METHOD,
  USER_ID_METADATA_KEY,
  VEHICLE_ID_METADATA_KEY,
} from "./upload.constants";
import type {
  CreateUploadIntentResult,
  UploadAsset,
  UploadAssetRepositoryPort,
  UploadObjectStoragePort,
} from "./upload.types";

const MILLISECONDS_PER_SECOND = 1_000;

export interface CreateUploadIntentServiceOptions {
  maximumUploadBytes: number;
  presignedUrlTtlSeconds: number;
  now?: () => Date;
  createId?: () => string;
}

export class CreateUploadIntentService {
  private readonly now: () => Date;
  private readonly createId: () => string;

  public constructor(
    private readonly assets: UploadAssetRepositoryPort,
    private readonly storage: UploadObjectStoragePort,
    private readonly options: CreateUploadIntentServiceOptions,
  ) {
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? randomUUID;
  }

  public async execute(
    userId: string,
    idempotencyKey: string,
    command: CreateUploadIntent,
  ): Promise<CreateUploadIntentResult> {
    if (command.sizeBytes > this.options.maximumUploadBytes) {
      return { ok: false, reason: "UPLOAD_LIMIT_EXCEEDED" };
    }

    const now = this.now();
    const assetId = this.createId();
    const objectKey = buildOriginalObjectKey(
      userId,
      command.vehicleId,
      assetId,
      command.mimeType,
    );
    const uploadExpiresAt = new Date(
      now.getTime() +
        this.options.presignedUrlTtlSeconds * MILLISECONDS_PER_SECOND,
    );
    const reservation = await this.assets.reservePendingOwned({
      id: assetId,
      userId,
      vehicleId: command.vehicleId,
      objectKey,
      filename: command.filename,
      mimeType: command.mimeType,
      sizeBytes: command.sizeBytes,
      checksumSha256: command.checksumSha256.toLowerCase(),
      idempotencyKey,
      uploadExpiresAt,
    });

    if (reservation.kind === "VEHICLE_NOT_FOUND") {
      return { ok: false, reason: "VEHICLE_NOT_FOUND" };
    }
    const asset = reservation.asset;
    if (!this.matchesExistingRequest(asset, command, idempotencyKey, now)) {
      return { ok: false, reason: "IDEMPOTENCY_CONFLICT" };
    }

    const remainingSeconds = Math.max(
      1,
      Math.floor(
        (asset.uploadExpiresAt.getTime() - now.getTime()) /
          MILLISECONDS_PER_SECOND,
      ),
    );

    try {
      const signed = await this.storage.createPresignedUpload({
        key: asset.originalObjectKey,
        contentType: command.mimeType,
        contentLength: command.sizeBytes,
        checksumSha256: command.checksumSha256,
        expiresInSeconds: Math.min(
          remainingSeconds,
          this.options.presignedUrlTtlSeconds,
        ),
        metadata: {
          [ASSET_ID_METADATA_KEY]: asset.id,
          [USER_ID_METADATA_KEY]: userId,
          [VEHICLE_ID_METADATA_KEY]: command.vehicleId,
        },
      });

      return {
        ok: true,
        response: {
          assetId: asset.id,
          uploadUrl: signed.url,
          method: UPLOAD_METHOD,
          headers: { ...signed.headers },
          expiresAt: asset.uploadExpiresAt.toISOString(),
        },
      };
    } catch {
      return { ok: false, reason: "STORAGE_UNAVAILABLE" };
    }
  }

  private matchesExistingRequest(
    asset: UploadAsset,
    command: CreateUploadIntent,
    idempotencyKey: string,
    now: Date,
  ): boolean {
    return (
      asset.status === "PENDING_UPLOAD" &&
      asset.uploadExpiresAt > now &&
      asset.vehicleId === command.vehicleId &&
      asset.originalFilename === command.filename &&
      asset.mimeType === command.mimeType &&
      asset.sizeBytes === BigInt(command.sizeBytes) &&
      asset.checksumSha256 === command.checksumSha256.toLowerCase() &&
      asset.idempotencyKey === idempotencyKey
    );
  }
}
