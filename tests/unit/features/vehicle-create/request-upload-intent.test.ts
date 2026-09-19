import { describe, expect, it, vi } from "vitest";

import { requestUploadIntent } from "../../../../apps/web/src/features/vehicle-create/request-upload-intent";

describe("requestUploadIntent", () => {
  it("validates a successful presign response", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({
        assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
        uploadUrl: "https://storage.example.test/upload",
        method: "PUT",
        headers: { "content-type": "image/jpeg" },
        expiresAt: "2026-09-19T12:05:00.000Z",
      }),
    );

    await expect(
      requestUploadIntent(
        {
          vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
          filename: "vehicle.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 5,
          checksumSha256: "00".repeat(32),
        },
        "0a10d8a2-0c9d-45e4-a503-37ca31a74018",
        fetcher,
      ),
    ).resolves.toMatchObject({ method: "PUT" });
  });

  it("surfaces a validated API error", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json(
        {
          error: {
            code: "CONFLICT",
            message: "Upload request conflict.",
            requestId: "request-0001",
          },
        },
        { status: 409 },
      ),
    );

    await expect(
      requestUploadIntent(
        {
          vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
          filename: "vehicle.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 5,
          checksumSha256: "00".repeat(32),
        },
        "0a10d8a2-0c9d-45e4-a503-37ca31a74018",
        fetcher,
      ),
    ).rejects.toThrow("Upload request conflict.");
  });
});
