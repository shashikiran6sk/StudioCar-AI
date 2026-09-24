import { describe, expect, it, vi } from "vitest";

import type { ActiveSession } from "../../../../apps/web/src/server/auth/session-service";
import { handleRemoveUpload } from "../../../../apps/web/src/server/uploads/remove-upload-handler";
import type { RemoveUploadResult, UploadRemovalApplication } from "../../../../apps/web/src/server/uploads/upload.types";

const ASSET_ID = "11111111-1111-4111-8111-111111111111";
const ENDPOINT = `https://app.studiocar.test/api/uploads/${ASSET_ID}`;

function activeSession(): ActiveSession {
  return {
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
}

function request(origin = "https://app.studiocar.test"): Request {
  return new Request(ENDPOINT, { method: "DELETE", headers: { origin } });
}

function application(): UploadRemovalApplication {
  return { remove: vi.fn(async (): Promise<RemoveUploadResult> => ({ ok: true })) };
}

describe("handleRemoveUpload", () => {
  it("scopes deletion to the authenticated user and application-owned ID", async () => {
    const removals = application();

    const response = await handleRemoveUpload(
      request(),
      { assetId: ASSET_ID },
      activeSession(),
      removals,
    );

    expect(response.status).toBe(204);
    expect(removals.remove).toHaveBeenCalledWith("user-1", ASSET_ID);
  });

  it("rejects cross-origin, unauthenticated, and malformed requests", async () => {
    const removals = application();
    const forbidden = await handleRemoveUpload(
      request("https://attacker.test"),
      { assetId: ASSET_ID },
      activeSession(),
      removals,
      () => "request-1",
    );
    const unauthenticated = await handleRemoveUpload(
      request(),
      { assetId: ASSET_ID },
      null,
      removals,
      () => "request-2",
    );
    const invalid = await handleRemoveUpload(
      request(),
      { assetId: "unsafe" },
      activeSession(),
      removals,
      () => "request-3",
    );

    expect(forbidden.status).toBe(403);
    expect(unauthenticated.status).toBe(401);
    expect(invalid.status).toBe(400);
    expect(removals.remove).not.toHaveBeenCalled();
  });

  it.each<["ASSET_NOT_FOUND" | "ASSET_NOT_REMOVABLE" | "STORAGE_UNAVAILABLE", number]>([
    ["ASSET_NOT_FOUND", 404],
    ["ASSET_NOT_REMOVABLE", 409],
    ["STORAGE_UNAVAILABLE", 503],
  ])("maps %s to HTTP %s", async (reason, status) => {
    const removals = application();
    vi.mocked(removals.remove).mockResolvedValue({ ok: false, reason });

    const response = await handleRemoveUpload(
      request(),
      { assetId: ASSET_ID },
      activeSession(),
      removals,
      () => "request-4",
    );

    expect(response.status).toBe(status);
  });
});
