import { describe, expect, it, vi } from "vitest";

import { DELETE } from "../../../../../../apps/web/src/app/api/uploads/[assetId]/route";
import { getCurrentSession } from "../../../../../../apps/web/src/server/auth/get-current-session";
import { handleRemoveUpload } from "../../../../../../apps/web/src/server/uploads/remove-upload-handler";
import { getUploadRemovalService } from "../../../../../../apps/web/src/server/uploads/upload-runtime";
import { RemoveUploadService } from "../../../../../../apps/web/src/server/uploads/remove-upload-service";

vi.mock("../../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));
vi.mock("../../../../../../apps/web/src/server/uploads/upload-runtime", () => ({
  getUploadRemovalService: vi.fn(),
}));
vi.mock(
  "../../../../../../apps/web/src/server/uploads/remove-upload-handler",
  () => ({
    handleRemoveUpload: vi.fn(async () => new Response(null, { status: 204 })),
  }),
);

describe("DELETE /api/uploads/:assetId", () => {
  it("resolves the dynamic path before delegating removal behavior", async () => {
    const session = {
      id: "session-1",
      userId: "user-1",
      expiresAt: new Date("2026-10-19T00:00:00.000Z"),
      user: {
        id: "user-1",
        displayName: null,
        primaryEmail: "owner@example.com",
        primaryPhone: null,
      },
    };
    const removals = new RemoveUploadService(
      {
        reserveUserUploadRemoval: vi.fn(),
        completeUserUploadRemoval: vi.fn(),
      },
      { deleteObject: vi.fn() },
    );
    const path = { assetId: "11111111-1111-4111-8111-111111111111" };
    vi.mocked(getCurrentSession).mockResolvedValue(session);
    vi.mocked(getUploadRemovalService).mockReturnValue(removals);
    const request = new Request(
      `https://app.studiocar.test/api/uploads/${path.assetId}`,
      { method: "DELETE" },
    );

    const response = await DELETE(request, { params: Promise.resolve(path) });

    expect(response.status).toBe(204);
    expect(handleRemoveUpload).toHaveBeenCalledWith(
      request,
      path,
      session,
      removals,
    );
  });
});
