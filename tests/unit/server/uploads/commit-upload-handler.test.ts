import { describe, expect, it, vi } from "vitest";

import { handleCommitUpload } from "../../../../apps/web/src/server/uploads/commit-upload-handler";
import type { UploadApplication } from "../../../../apps/web/src/server/uploads/upload.types";
import type { CommitUploadResult } from "../../../../apps/web/src/server/uploads/upload.types";
import type { ActiveSession } from "../../../../apps/web/src/server/auth/session-service";

const ENDPOINT =
  "https://app.studiocar.test/api/uploads/11111111-1111-4111-8111-111111111111/commit";
const path = { assetId: "11111111-1111-4111-8111-111111111111" };

function activeSession(): ActiveSession {
  return {
    id: "session-1",
    userId: "user-1",
    expiresAt: new Date("2026-10-19T00:00:00.000Z"),
    user: {
      id: "user-1",
      displayName: null,
      primaryEmail: "priya@example.com",
      primaryPhone: null,
    },
  };
}

function application(): UploadApplication {
  const result: CommitUploadResult = {
    ok: true,
    response: {
      assetId: path.assetId,
      status: "UPLOADED",
      mimeType: "image/png",
      sizeBytes: 24,
      width: 20,
      height: 10,
    },
  };
  return {
    createIntent: vi.fn(),
    commit: vi.fn(async () => result),
  };
}

function request(origin = "https://app.studiocar.test"): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ etag: '"etag"' }),
  });
}

describe("handleCommitUpload", () => {
  it("commits only the authenticated user's validated asset path", async () => {
    const uploads = application();
    const response = await handleCommitUpload(
      request(),
      path,
      activeSession(),
      uploads,
    );

    expect(response.status).toBe(200);
    expect(uploads.commit).toHaveBeenCalledWith(
      "user-1",
      path.assetId,
      '"etag"',
    );
  });

  it("rejects cross-origin, unauthenticated, and malformed commits", async () => {
    const uploads = application();
    const forbidden = await handleCommitUpload(
      request("https://attacker.test"),
      path,
      activeSession(),
      uploads,
      () => "request-1",
    );
    const unauthenticated = await handleCommitUpload(
      request(),
      path,
      null,
      uploads,
      () => "request-2",
    );
    const invalidPath = await handleCommitUpload(
      request(),
      { assetId: "invalid" },
      activeSession(),
      uploads,
      () => "request-3",
    );

    expect(forbidden.status).toBe(403);
    expect(unauthenticated.status).toBe(401);
    expect(invalidPath.status).toBe(400);
    expect(uploads.commit).not.toHaveBeenCalled();
  });
});
