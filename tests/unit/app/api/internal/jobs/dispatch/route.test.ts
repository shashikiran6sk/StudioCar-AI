import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../../apps/web/src/app/api/internal/jobs/dispatch/route";
import { handleDispatchProcessingOutbox } from "../../../../../../../apps/web/src/server/jobs/dispatch-processing-outbox-handler";
import { ProcessingJobService } from "../../../../../../../apps/web/src/server/jobs/processing-job-service";
import { ProcessingStatusService } from "../../../../../../../apps/web/src/server/jobs/processing-status-service";
import { getProcessingRuntime } from "../../../../../../../apps/web/src/server/jobs/processing-runtime";
import { CommandRateLimiter } from "../../../../../../../apps/web/src/server/security/command-rate-limiter";
import {
  CommandRateLimitScope,
  ProcessingProvider,
} from "../../../../../../../packages/database/generated/prisma/client";
import { ProcessingOutboxDispatcher } from "../../../../../../../packages/processing/src/processing-outbox-dispatcher";
import type {
  ProcessingOutboxRepositoryPort,
  ProcessingQueuePort,
} from "../../../../../../../packages/processing/src/processing-outbox.types";

vi.mock(
  "../../../../../../../apps/web/src/server/jobs/processing-runtime",
  () => ({ getProcessingRuntime: vi.fn() }),
);
vi.mock(
  "../../../../../../../apps/web/src/server/jobs/dispatch-processing-outbox-handler",
  () => ({
    handleDispatchProcessingOutbox: vi.fn(
      async () => new Response(null, { status: 200 }),
    ),
  }),
);

describe("POST /api/internal/jobs/dispatch", () => {
  it("delegates to the protected recovery handler", async () => {
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
    const dispatchToken = "processing-dispatch-token-at-least-32-characters";
    const rateLimiter = new CommandRateLimiter(
      { consume: vi.fn() },
      {
        scope: CommandRateLimitScope.PROCESSING_BATCH,
        maximumRequests: 20,
        windowMilliseconds: 60_000,
      },
    );
    vi.mocked(getProcessingRuntime).mockReturnValue({
      dispatchToken,
      dispatcher,
      rateLimiter,
      service,
      statusService: new ProcessingStatusService({ findOwned: vi.fn() }),
    });
    const request = new Request(
      "https://app.studiocar.test/api/internal/jobs/dispatch",
      { method: "POST" },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(handleDispatchProcessingOutbox).toHaveBeenCalledWith(
      request,
      dispatchToken,
      dispatcher,
    );
  });
});
