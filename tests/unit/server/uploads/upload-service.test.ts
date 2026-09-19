import { describe, expect, it, vi } from "vitest";

import { UploadService } from "../../../../apps/web/src/server/uploads/upload-service";
import type {
  CommitUploadResult,
  CreateUploadIntentResult,
} from "../../../../apps/web/src/server/uploads/upload.types";

describe("UploadService", () => {
  it("delegates upload intent and commit commands to their focused services", async () => {
    const intentResult: CreateUploadIntentResult = {
      ok: false,
      reason: "VEHICLE_NOT_FOUND",
    };
    const commitResult: CommitUploadResult = {
      ok: false,
      reason: "ASSET_NOT_FOUND",
    };
    const intents = {
      execute: vi.fn(async () => intentResult),
    };
    const commits = {
      execute: vi.fn(async () => commitResult),
    };
    const service = new UploadService(intents, commits);
    const command = {
      vehicleId: "22222222-2222-4222-8222-222222222222",
      filename: "vehicle.png",
      mimeType: "image/png",
      sizeBytes: 24,
      checksumSha256: "00".repeat(32),
    } satisfies Parameters<UploadService["createIntent"]>[2];

    await expect(
      service.createIntent("user-1", "upload-request-0001", command),
    ).resolves.toMatchObject({ reason: "VEHICLE_NOT_FOUND" });
    await expect(
      service.commit("user-1", "asset-1", undefined),
    ).resolves.toMatchObject({ reason: "ASSET_NOT_FOUND" });
  });
});
