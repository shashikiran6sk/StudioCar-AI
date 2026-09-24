import { describe, expect, it, vi } from "vitest";

import { removePhotoUpload } from "../../../../apps/web/src/features/vehicle-create/remove-photo-upload";

describe("removePhotoUpload", () => {
  it("deletes by application-owned asset ID", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(null, { status: 204 }),
    );

    await expect(
      removePhotoUpload("11111111-1111-4111-8111-111111111111", fetcher),
    ).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledWith(
      "/api/uploads/11111111-1111-4111-8111-111111111111",
      { method: "DELETE" },
    );
  });

  it("shows the safe server error and falls back for malformed responses", async () => {
    const serverError = vi.fn<typeof fetch>(async () =>
      Response.json(
        {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "The image could not be removed from storage. Please try again.",
            requestId: "request-1",
          },
        },
        { status: 503 },
      ),
    );
    const malformed = vi.fn<typeof fetch>(async () =>
      new Response("not-json", { status: 503 }),
    );

    await expect(removePhotoUpload("asset-1", serverError)).rejects.toThrow(
      "The image could not be removed from storage. Please try again.",
    );
    await expect(removePhotoUpload("asset-1", malformed)).rejects.toThrow(
      "The image could not be removed. Please try again.",
    );
  });
});
