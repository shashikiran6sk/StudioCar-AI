import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../../apps/web/src/app/api/uploads/[assetId]/commit/route";
import { getCurrentSession } from "../../../../../../../apps/web/src/server/auth/get-current-session";
import { handleCommitUpload } from "../../../../../../../apps/web/src/server/uploads/commit-upload-handler";
import { getUploadService } from "../../../../../../../apps/web/src/server/uploads/upload-runtime";
import { UploadService } from "../../../../../../../apps/web/src/server/uploads/upload-service";

vi.mock(
  "../../../../../../../apps/web/src/server/auth/get-current-session",
  () => ({ getCurrentSession: vi.fn() }),
);
vi.mock(
  "../../../../../../../apps/web/src/server/uploads/upload-runtime",
  () => ({ getUploadService: vi.fn() }),
);
vi.mock(
  "../../../../../../../apps/web/src/server/uploads/commit-upload-handler",
  () => ({
    handleCommitUpload: vi.fn(
      async () => new Response(null, { status: 204 }),
    ),
  }),
);

describe("POST /api/uploads/:assetId/commit", () => {
  it("resolves the dynamic path before delegating commit behavior", async () => {
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
    const uploads = new UploadService(
      { execute: vi.fn() },
      { execute: vi.fn() },
    );
    const path = { assetId: "11111111-1111-4111-8111-111111111111" };
    vi.mocked(getCurrentSession).mockResolvedValue(session);
    vi.mocked(getUploadService).mockReturnValue(uploads);
    const request = new Request(
      `https://app.studiocar.test/api/uploads/${path.assetId}/commit`,
      { method: "POST" },
    );

    const response = await POST(request, { params: Promise.resolve(path) });

    expect(response.status).toBe(204);
    expect(handleCommitUpload).toHaveBeenCalledWith(
      request,
      path,
      session,
      uploads,
    );
  });
});
