import { describe, expect, it, vi } from "vitest";

import { handleCreateProcessingBatch } from "../../../../apps/web/src/server/jobs/create-processing-batch-handler";
import type { ActiveSession } from "../../../../apps/web/src/server/auth/session-service";
import type { ProcessingJobApplication } from "../../../../apps/web/src/server/jobs/processing-job.types";
import type { CommandRateLimiterPort } from "../../../../apps/web/src/server/security/command-rate-limiter.types";

const ENDPOINT = "https://app.studiocar.test/api/jobs";
const VEHICLE_ID = "0e879f46-1193-4d77-b785-057fe026d998";
const ASSET_ID = "331a1e25-b9d8-4b1a-a398-8351a58f8c24";
const JOB_ID = "8c879f46-1193-4d77-b785-057fe026d111";
const session: ActiveSession = {
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

function allowingRateLimiter(): CommandRateLimiterPort {
  return {
    consume: vi.fn(
      async (): Promise<{ allowed: true }> => ({ allowed: true }),
    ),
  };
}

function createRequest(
  body: unknown,
  idempotencyKey = "processing-request-0001",
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

describe("handleCreateProcessingBatch", () => {
  it("accepts an authenticated normalized batch", async () => {
    const jobs: ProcessingJobApplication = {
      createBatch: vi.fn().mockResolvedValue({
        ok: true,
        response: {
          jobs: [{ jobId: JOB_ID, assetId: ASSET_ID, state: "QUEUED" }],
          replayed: false,
        },
      }),
    };
    const response = await handleCreateProcessingBatch(
      createRequest({ vehicleId: VEHICLE_ID, assetIds: [ASSET_ID], options: {} }),
      session,
      jobs,
      allowingRateLimiter(),
    );

    expect(response.status).toBe(202);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(jobs.createBatch).toHaveBeenCalledWith(
      session.userId,
      "processing-request-0001",
      expect.objectContaining({ vehicleId: VEHICLE_ID, assetIds: [ASSET_ID] }),
    );
  });

  it("rejects cross-origin, unauthenticated, and invalid commands", async () => {
    const jobs: ProcessingJobApplication = { createBatch: vi.fn() };
    const crossOrigin = await handleCreateProcessingBatch(
      createRequest({}, "processing-request-0001", "https://attacker.test"),
      session,
      jobs,
      allowingRateLimiter(),
      () => "request-0001",
    );
    const unauthenticated = await handleCreateProcessingBatch(
      createRequest({}),
      null,
      jobs,
      allowingRateLimiter(),
      () => "request-0002",
    );
    const invalid = await handleCreateProcessingBatch(
      createRequest({ vehicleId: VEHICLE_ID, assetIds: [], options: {} }),
      session,
      jobs,
      allowingRateLimiter(),
      () => "request-0003",
    );

    expect(crossOrigin.status).toBe(403);
    expect(unauthenticated.status).toBe(401);
    expect(invalid.status).toBe(400);
    expect(jobs.createBatch).not.toHaveBeenCalled();
  });

  it("maps ownership, state, and availability failures", async () => {
    const jobs: ProcessingJobApplication = {
      createBatch: vi
        .fn()
        .mockResolvedValueOnce({ ok: false, reason: "VEHICLE_NOT_FOUND" })
        .mockResolvedValueOnce({ ok: false, reason: "ASSETS_NOT_READY" })
        .mockRejectedValueOnce(new Error("database unavailable")),
    };
    const command = { vehicleId: VEHICLE_ID, assetIds: [ASSET_ID], options: {} };

    expect(
      (
        await handleCreateProcessingBatch(
          createRequest(command),
          session,
          jobs,
          allowingRateLimiter(),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await handleCreateProcessingBatch(
          createRequest(command),
          session,
          jobs,
          allowingRateLimiter(),
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await handleCreateProcessingBatch(
          createRequest(command),
          session,
          jobs,
          allowingRateLimiter(),
        )
      ).status,
    ).toBe(503);
  });

  it("returns a retry window without reserving a processing batch", async () => {
    const jobs: ProcessingJobApplication = { createBatch: vi.fn() };
    const rateLimiter: CommandRateLimiterPort = {
      consume: vi.fn(async () => ({
        allowed: false,
        retryAfterSeconds: 17,
      })),
    };
    const response = await handleCreateProcessingBatch(
      createRequest({ vehicleId: VEHICLE_ID, assetIds: [ASSET_ID], options: {} }),
      session,
      jobs,
      rateLimiter,
      () => "request-limited",
    );

    await expect(response.json()).resolves.toMatchObject({
      error: { code: "RATE_LIMITED", requestId: "request-limited" },
    });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("17");
    expect(jobs.createBatch).not.toHaveBeenCalled();
  });
});
