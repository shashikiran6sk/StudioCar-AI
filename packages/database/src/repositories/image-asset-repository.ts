import type { SupportedImageMimeType } from "@studiocar/contracts";

import type { PrismaClient } from "../../generated/prisma/client";
import { ImageAssetStatus, Prisma } from "../../generated/prisma/client";

const imageAssetSelect = {
  id: true,
  userId: true,
  vehicleId: true,
  status: true,
  originalObjectKey: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true,
  checksumSha256: true,
  idempotencyKey: true,
  uploadExpiresAt: true,
  uploadedAt: true,
  invalidReason: true,
  width: true,
  height: true,
} satisfies Prisma.ImageAssetSelect;

export type ImageAssetRecord = Prisma.ImageAssetGetPayload<{
  select: typeof imageAssetSelect;
}>;

export interface CreatePendingImageAsset {
  id: string;
  userId: string;
  vehicleId: string;
  objectKey: string;
  filename: string;
  mimeType: SupportedImageMimeType;
  sizeBytes: number;
  checksumSha256: string;
  idempotencyKey: string;
  uploadExpiresAt: Date;
}

export interface UploadedImageMetadata {
  width: number;
  height: number;
  uploadedAt: Date;
}

export type ReserveImageAssetResult =
  | { kind: "CREATED"; asset: ImageAssetRecord }
  | { kind: "EXISTING"; asset: ImageAssetRecord }
  | { kind: "VEHICLE_NOT_FOUND" };

export class PrismaImageAssetRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async reservePendingOwned(
    command: CreatePendingImageAsset,
  ): Promise<ReserveImageAssetResult> {
    const existing = await this.findByIdempotencyKey(
      command.userId,
      command.idempotencyKey,
    );
    if (existing) return { kind: "EXISTING", asset: existing };

    try {
      return await this.database.$transaction(async (transaction) => {
        const vehicle = await transaction.vehicle.findFirst({
          where: { id: command.vehicleId, userId: command.userId },
          select: { id: true },
        });
        if (!vehicle) return { kind: "VEHICLE_NOT_FOUND" };

        const asset = await transaction.imageAsset.create({
          data: {
            id: command.id,
            userId: command.userId,
            vehicleId: command.vehicleId,
            originalObjectKey: command.objectKey,
            originalFilename: command.filename,
            mimeType: command.mimeType,
            sizeBytes: command.sizeBytes,
            checksumSha256: command.checksumSha256,
            idempotencyKey: command.idempotencyKey,
            uploadExpiresAt: command.uploadExpiresAt,
          },
          select: imageAssetSelect,
        });
        return { kind: "CREATED", asset };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const raced = await this.findByIdempotencyKey(
          command.userId,
          command.idempotencyKey,
        );
        if (raced) return { kind: "EXISTING", asset: raced };
      }
      throw error;
    }
  }

  public findOwnedById(
    userId: string,
    assetId: string,
  ): Promise<ImageAssetRecord | null> {
    return this.database.imageAsset.findFirst({
      where: { id: assetId, userId },
      select: imageAssetSelect,
    });
  }

  public async markUploadedOwned(
    userId: string,
    assetId: string,
    metadata: UploadedImageMetadata,
  ): Promise<ImageAssetRecord | null> {
    await this.database.imageAsset.updateMany({
      where: {
        id: assetId,
        userId,
        status: ImageAssetStatus.PENDING_UPLOAD,
      },
      data: {
        status: ImageAssetStatus.UPLOADED,
        width: metadata.width,
        height: metadata.height,
        uploadedAt: metadata.uploadedAt,
        invalidReason: null,
      },
    });
    return this.findOwnedById(userId, assetId);
  }

  public async markInvalidOwned(
    userId: string,
    assetId: string,
    reason: string,
  ): Promise<ImageAssetRecord | null> {
    await this.database.imageAsset.updateMany({
      where: {
        id: assetId,
        userId,
        status: ImageAssetStatus.PENDING_UPLOAD,
      },
      data: { status: ImageAssetStatus.INVALID, invalidReason: reason },
    });
    return this.findOwnedById(userId, assetId);
  }

  private findByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<ImageAssetRecord | null> {
    return this.database.imageAsset.findFirst({
      where: { userId, idempotencyKey },
      select: imageAssetSelect,
    });
  }
}
