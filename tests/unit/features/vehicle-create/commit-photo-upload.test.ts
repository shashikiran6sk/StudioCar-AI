import { describe, expect, it, vi } from "vitest";

import { commitPhotoUpload } from "../../../../apps/web/src/features/vehicle-create/commit-photo-upload";

describe("commitPhotoUpload", () => {
  it("validates authoritative committed image metadata", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({
        assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
        status: "UPLOADED",
        mimeType: "image/jpeg",
        sizeBytes: 5,
        width: 1920,
        height: 1080,
      }),
    );

    await expect(
      commitPhotoUpload(
        "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
        '"etag"',
        fetcher,
      ),
    ).resolves.toMatchObject({ width: 1920, height: 1080 });
  });
});
