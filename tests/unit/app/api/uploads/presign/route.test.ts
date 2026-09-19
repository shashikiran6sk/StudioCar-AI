import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../apps/web/src/app/api/uploads/presign/route";
import { getCurrentSession } from "../../../../../../apps/web/src/server/auth/get-current-session";
import { handleCreateUploadIntent } from "../../../../../../apps/web/src/server/uploads/create-upload-intent-handler";
import { getUploadService } from "../../../../../../apps/web/src/server/uploads/upload-runtime";
import { UploadService } from "../../../../../../apps/web/src/server/uploads/upload-service";

vi.mock("../../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));
vi.mock("../../../../../../apps/web/src/server/uploads/upload-runtime", () => ({
  getUploadService: vi.fn(),
}));
vi.mock(
  "../../../../../../apps/web/src/server/uploads/create-upload-intent-handler",
  () => ({
    handleCreateUploadIntent: vi.fn(
      async () => new Response(null, { status: 201 }),
    ),
  }),
);

describe("POST /api/uploads/presign", () => {
  it("delegates authentication and upload-intent behavior", async () => {
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
    vi.mocked(getCurrentSession).mockResolvedValue(session);
    vi.mocked(getUploadService).mockReturnValue(uploads);
    const request = new Request(
      "https://app.studiocar.test/api/uploads/presign",
      { method: "POST" },
    );

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(handleCreateUploadIntent).toHaveBeenCalledWith(
      request,
      session,
      uploads,
    );
  });
});
