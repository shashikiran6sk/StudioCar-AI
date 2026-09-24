import type {
  CommitUploadResponse,
  CreateUploadIntent,
  CreateUploadIntentResponse,
  ImageAssetStatus,
  SupportedImageMimeType,
} from "@studiocar/contracts";

export interface UploadAsset {
  id: string;
  userId: string;
  vehicleId: string;
  status: ImageAssetStatus;
  originalObjectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: bigint;
  checksumSha256: string | null;
  idempotencyKey: string | null;
  uploadExpiresAt: Date;
  uploadedAt: Date | null;
  invalidReason: string | null;
  width: number | null;
  height: number | null;
}

export interface ReserveUploadAssetCommand {
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

export type ReserveUploadAssetResult =
  | { kind: "CREATED"; asset: UploadAsset }
  | { kind: "EXISTING"; asset: UploadAsset }
  | { kind: "VEHICLE_NOT_FOUND" };

export interface UploadAssetRepositoryPort {
  reservePendingOwned(
    command: ReserveUploadAssetCommand,
  ): Promise<ReserveUploadAssetResult>;
  findOwnedById(userId: string, assetId: string): Promise<UploadAsset | null>;
  markUploadedOwned(
    userId: string,
    assetId: string,
    metadata: { width: number; height: number; uploadedAt: Date },
  ): Promise<UploadAsset | null>;
  markInvalidOwned(
    userId: string,
    assetId: string,
    reason: string,
  ): Promise<UploadAsset | null>;
}

export interface CreatePresignedUploadCommand {
  key: string;
  contentType: SupportedImageMimeType;
  contentLength: number;
  checksumSha256: string;
  expiresInSeconds: number;
  metadata: Readonly<Record<string, string>>;
}

export interface PresignedUpload {
  url: string;
  headers: Readonly<Record<string, string>>;
}

export interface StoredObjectMetadata {
  contentLength: number;
  contentType: string | undefined;
  checksumSha256: string | undefined;
  etag: string | undefined;
  metadata: Readonly<Record<string, string>>;
}

export interface UploadObjectStoragePort {
  createPresignedUpload(
    command: CreatePresignedUploadCommand,
  ): Promise<PresignedUpload>;
  headObject(key: string): Promise<StoredObjectMetadata | null>;
  readObjectPrefix(key: string, maximumBytes: number): Promise<Uint8Array>;
}

export type CreateUploadIntentResult =
  | { ok: true; response: CreateUploadIntentResponse }
  | {
      ok: false;
      reason:
        | "VEHICLE_NOT_FOUND"
        | "UPLOAD_LIMIT_EXCEEDED"
        | "IDEMPOTENCY_CONFLICT"
        | "STORAGE_UNAVAILABLE";
    };

export type CommitUploadResult =
  | { ok: true; response: CommitUploadResponse }
  | {
      ok: false;
      reason:
        | "ASSET_NOT_FOUND"
        | "ASSET_INVALID"
        | "OBJECT_MISSING"
        | "OBJECT_INVALID"
        | "STORAGE_UNAVAILABLE";
    };

export type RemoveUploadResult =
  | { ok: true }
  | {
      ok: false;
      reason: "ASSET_NOT_FOUND" | "ASSET_NOT_REMOVABLE" | "STORAGE_UNAVAILABLE";
    };

export interface UploadRemovalApplication {
  remove(userId: string, assetId: string): Promise<RemoveUploadResult>;
}

export interface UploadApplication {
  createIntent(
    userId: string,
    idempotencyKey: string,
    command: CreateUploadIntent,
  ): Promise<CreateUploadIntentResult>;
  commit(
    userId: string,
    assetId: string,
    etag: string | undefined,
  ): Promise<CommitUploadResult>;
}
