import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../apps/web/src/app/api/uploads/presign/route";
import { getCurrentSession } from "../../../../../../apps/web/src/server/auth/get-current-session";
import { handleCreateUploadIntent } from "../../../../../../apps/web/src/server/uploads/create-upload-intent-handler";
import { getUploadRuntime } from "../../../../../../apps/web/src/server/uploads/upload-runtime";
import { UploadService } from "../../../../../../apps/web/src/server/uploads/upload-service";
import { RemoveUploadService } from "../../../../../../apps/web/src/server/uploads/remove-upload-service";
import { CommandRateLimiter } from "../../../../../../apps/web/src/server/security/command-rate-limiter";
import { CommandRateLimitScope } from "../../../../../../packages/database-runtime/generated/prisma/client";

vi.mock("../../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));
vi.mock("../../../../../../apps/web/src/server/uploads/upload-runtime", () => ({
  getUploadRuntime: vi.fn(),
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
    const rateLimiter = new CommandRateLimiter(
      { consume: vi.fn() },
      {
        scope: CommandRateLimitScope.UPLOAD_PRESIGN,
        maximumRequests: 120,
        windowMilliseconds: 60_000,
      },
    );
    vi.mocked(getCurrentSession).mockResolvedValue(session);
    vi.mocked(getUploadRuntime).mockReturnValue({
      rateLimiter,
      removals: new RemoveUploadService(
        {
          reserveUserUploadRemoval: vi.fn(),
          completeUserUploadRemoval: vi.fn(),
        },
        { deleteObject: vi.fn() },
      ),
      service: uploads,
    });
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
      rateLimiter,
    );
  });
});
