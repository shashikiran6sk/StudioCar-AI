import { describe, expect, it, vi } from "vitest";

import { handleGetProcessingStatuses } from "../../../../apps/web/src/server/jobs/get-processing-status-handler";
import type { ActiveSession } from "../../../../apps/web/src/server/auth/session-service";
import type { ProcessingStatusApplication } from "../../../../apps/web/src/server/jobs/processing-status.types";

const JOB_ID = "8c879f46-1193-4d77-b785-057fe026d111";
const session: ActiveSession = {
  id: "session-1",
  userId: "owner-id",
  expiresAt: new Date("2026-10-19T00:00:00.000Z"),
  user: {
    id: "owner-id",
    displayName: null,
    primaryEmail: "owner@example.com",
    primaryPhone: null,
  },
};

describe("handleGetProcessingStatuses", () => {
  it("returns an authenticated private batched response", async () => {
    const statuses: ProcessingStatusApplication = {
      getStatuses: vi.fn().mockResolvedValue({ ok: true, response: { jobs: [] } }),
    };
    const response = await handleGetProcessingStatuses(
      new Request(`https://app.studiocar.test/api/jobs?ids=${JOB_ID}`),
      session,
      statuses,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(statuses.getStatuses).toHaveBeenCalledWith("owner-id", {
      ids: [JOB_ID],
    });
  });

  it("rejects unauthenticated, invalid, and non-owned queries", async () => {
    const statuses: ProcessingStatusApplication = {
      getStatuses: vi.fn().mockResolvedValue({ ok: false, reason: "NOT_FOUND" }),
    };
    const request = new Request(
      `https://app.studiocar.test/api/jobs?ids=${JOB_ID}`,
    );

    expect(
      (await handleGetProcessingStatuses(request, null, statuses)).status,
    ).toBe(401);
    expect(
      (
        await handleGetProcessingStatuses(
          new Request("https://app.studiocar.test/api/jobs?ids=invalid"),
          session,
          statuses,
        )
      ).status,
    ).toBe(400);
    expect((await handleGetProcessingStatuses(request, session, statuses)).status).toBe(
      404,
    );
  });
});
