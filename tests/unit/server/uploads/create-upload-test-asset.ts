import type { UploadAsset } from "../../../../apps/web/src/server/uploads/upload.types";

export function createUploadTestAsset(
  overrides: Partial<UploadAsset> = {},
): UploadAsset {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    userId: "user-1",
    vehicleId: "22222222-2222-4222-8222-222222222222",
    status: "PENDING_UPLOAD",
    originalObjectKey:
      "users/user-1/vehicles/vehicle-1/assets/asset-1/original/source.png",
    originalFilename: "vehicle.png",
    mimeType: "image/png",
    sizeBytes: 24n,
    checksumSha256: "00".repeat(32),
    idempotencyKey: "upload-request-0001",
    uploadExpiresAt: new Date("2026-09-19T12:05:00.000Z"),
    uploadedAt: null,
    invalidReason: null,
    width: null,
    height: null,
    ...overrides,
  };
}
