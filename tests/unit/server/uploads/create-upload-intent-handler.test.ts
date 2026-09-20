import { describe, expect, it, vi } from "vitest";

import { handleCreateUploadIntent } from "../../../../apps/web/src/server/uploads/create-upload-intent-handler";
import type { UploadApplication } from "../../../../apps/web/src/server/uploads/upload.types";
import type { CreateUploadIntentResult } from "../../../../apps/web/src/server/uploads/upload.types";
import type { ActiveSession } from "../../../../apps/web/src/server/auth/session-service";
import type { CommandRateLimiterPort } from "../../../../apps/web/src/server/security/command-rate-limiter.types";

const ENDPOINT = "https://app.studiocar.test/api/uploads/presign";

function activeSession(): ActiveSession {
  return {
    id: "session-1",
    userId: "user-1",
    expiresAt: new Date("2026-10-19T00:00:00.000Z"),
    user: {
      id: "user-1",
      displayName: "Priya Sharma",
      primaryEmail: "priya@example.com",
      primaryPhone: null,
    },
  };
}

function application(): UploadApplication {
  const result: CreateUploadIntentResult = {
    ok: true,
    response: {
      assetId: "11111111-1111-4111-8111-111111111111",
      uploadUrl: "https://assets.example.test/upload",
      method: "PUT",
      headers: { "content-type": "image/png" },
      expiresAt: "2026-09-19T12:05:00.000Z",
    },
  };
  return {
    createIntent: vi.fn(async () => result),
    commit: vi.fn(),
  };
}

function allowingRateLimiter(): CommandRateLimiterPort {
  return {
    consume: vi.fn(
      async (): Promise<{ allowed: true }> => ({ allowed: true }),
    ),
  };
}

function request(
  body: unknown,
  idempotencyKey = "upload-request-0001",
  origin = "https://app.studiocar.test",
): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
      origin,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  vehicleId: "22222222-2222-4222-8222-222222222222",
  filename: "vehicle.png",
  mimeType: "image/png",
  sizeBytes: 24,
  checksumSha256: "00".repeat(32),
};

describe("handleCreateUploadIntent", () => {
  it("authenticates, validates, and scopes the command to the session user", async () => {
    const uploads = application();
    const response = await handleCreateUploadIntent(
      request(validBody),
      activeSession(),
      uploads,
      allowingRateLimiter(),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(uploads.createIntent).toHaveBeenCalledWith(
      "user-1",
      "upload-request-0001",
      validBody,
    );
  });

  it("rejects unauthenticated, cross-origin, and invalid requests", async () => {
    const uploads = application();
    const unauthenticated = await handleCreateUploadIntent(
      request(validBody),
      null,
      uploads,
      allowingRateLimiter(),
      () => "request-1",
    );
    const forbidden = await handleCreateUploadIntent(
      request(validBody, "upload-request-0001", "https://attacker.test"),
      activeSession(),
      uploads,
      allowingRateLimiter(),
      () => "request-2",
    );
    const invalid = await handleCreateUploadIntent(
      request({ ...validBody, checksumSha256: "bad" }),
      activeSession(),
      uploads,
      allowingRateLimiter(),
      () => "request-3",
    );
    const missingIdempotency = await handleCreateUploadIntent(
      request(validBody, "bad"),
      activeSession(),
      uploads,
      allowingRateLimiter(),
      () => "request-4",
    );

    expect(unauthenticated.status).toBe(401);
    expect(forbidden.status).toBe(403);
    expect(invalid.status).toBe(400);
    expect(missingIdempotency.status).toBe(400);
    expect(uploads.createIntent).not.toHaveBeenCalled();
  });

  it("returns a retry window without creating another upload intent", async () => {
    const uploads = application();
    const rateLimiter: CommandRateLimiterPort = {
      consume: vi.fn(async () => ({
        allowed: false,
        retryAfterSeconds: 42,
      })),
    };

    const response = await handleCreateUploadIntent(
      request(validBody),
      activeSession(),
      uploads,
      rateLimiter,
      () => "request-limited",
    );

    await expect(response.json()).resolves.toMatchObject({
      error: { code: "RATE_LIMITED", requestId: "request-limited" },
    });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
    expect(uploads.createIntent).not.toHaveBeenCalled();
  });
});
