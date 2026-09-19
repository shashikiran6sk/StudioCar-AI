import { describe, expect, it, vi } from "vitest";

import { GET, POST } from "../../../../../apps/web/src/app/api/jobs/route";
import { getCurrentSession } from "../../../../../apps/web/src/server/auth/get-current-session";
import { handleCreateProcessingBatch } from "../../../../../apps/web/src/server/jobs/create-processing-batch-handler";
import { ProcessingJobService } from "../../../../../apps/web/src/server/jobs/processing-job-service";
import { ProcessingStatusService } from "../../../../../apps/web/src/server/jobs/processing-status-service";
import { handleGetProcessingStatuses } from "../../../../../apps/web/src/server/jobs/get-processing-status-handler";
import { getProcessingRuntime } from "../../../../../apps/web/src/server/jobs/processing-runtime";
import { ProcessingProvider } from "../../../../../packages/database/generated/prisma/client";
import { ProcessingOutboxDispatcher } from "../../../../../packages/processing/src/processing-outbox-dispatcher";
import type {
  ProcessingOutboxRepositoryPort,
  ProcessingQueuePort,
} from "../../../../../packages/processing/src/processing-outbox.types";

vi.mock("../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));
vi.mock("../../../../../apps/web/src/server/jobs/processing-runtime", () => ({
  getProcessingRuntime: vi.fn(),
}));
vi.mock(
  "../../../../../apps/web/src/server/jobs/create-processing-batch-handler",
  () => ({
    handleCreateProcessingBatch: vi.fn(
      async () => new Response(null, { status: 202 }),
    ),
  }),
);
vi.mock(
  "../../../../../apps/web/src/server/jobs/get-processing-status-handler",
  () => ({
    handleGetProcessingStatuses: vi.fn(
      async () => new Response(null, { status: 200 }),
    ),
  }),
);

describe("POST /api/jobs", () => {
  it("delegates authentication and processing behavior", async () => {
    const outbox: ProcessingOutboxRepositoryPort = {
      claimPendingOutbox: vi.fn(),
      markOutboxPublished: vi.fn(),
      releaseOutboxClaim: vi.fn(),
    };
    const queue: ProcessingQueuePort = { publish: vi.fn() };
    const dispatcher = new ProcessingOutboxDispatcher(outbox, queue, {
      batchSize: 20,
      claimTtlMilliseconds: 30_000,
      retryBaseMilliseconds: 1_000,
      retryMaximumMilliseconds: 60_000,
    });
    const service = new ProcessingJobService(
      { reserveBatchOwned: vi.fn() },
      dispatcher,
      ProcessingProvider.REMOVEBG,
    );
    const statusService = new ProcessingStatusService({ findOwned: vi.fn() });
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
    vi.mocked(getCurrentSession).mockResolvedValue(session);
    vi.mocked(getProcessingRuntime).mockReturnValue({
      dispatchToken: "processing-dispatch-token-at-least-32-characters",
      dispatcher,
      service,
      statusService,
    });
    const request = new Request("https://app.studiocar.test/api/jobs", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(202);
    expect(handleCreateProcessingBatch).toHaveBeenCalledWith(
      request,
      session,
      service,
    );
  });

  it("delegates GET authentication and status behavior", async () => {
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
    const outbox: ProcessingOutboxRepositoryPort = {
      claimPendingOutbox: vi.fn(),
      markOutboxPublished: vi.fn(),
      releaseOutboxClaim: vi.fn(),
    };
    const dispatcher = new ProcessingOutboxDispatcher(outbox, { publish: vi.fn() }, {
      batchSize: 20,
      claimTtlMilliseconds: 30_000,
      retryBaseMilliseconds: 1_000,
      retryMaximumMilliseconds: 60_000,
    });
    const statusService = new ProcessingStatusService({ findOwned: vi.fn() });
    vi.mocked(getCurrentSession).mockResolvedValue(session);
    vi.mocked(getProcessingRuntime).mockReturnValue({
      dispatchToken: "processing-dispatch-token-at-least-32-characters",
      dispatcher,
      service: new ProcessingJobService(
        { reserveBatchOwned: vi.fn() },
        dispatcher,
        ProcessingProvider.REMOVEBG,
      ),
      statusService,
    });
    const request = new Request("https://app.studiocar.test/api/jobs?ids=job");

    expect((await GET(request)).status).toBe(200);
    expect(handleGetProcessingStatuses).toHaveBeenCalledWith(
      request,
      session,
      statusService,
    );
  });
});
