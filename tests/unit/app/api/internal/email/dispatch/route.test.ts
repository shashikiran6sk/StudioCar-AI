import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../../apps/web/src/app/api/internal/email/dispatch/route";
import { handleDispatchEmailOutbox } from "../../../../../../../apps/web/src/server/email/dispatch-email-outbox-handler";
import { getEmailRuntime } from "../../../../../../../apps/web/src/server/email/email-runtime";
import { EmailOutboxDispatcher } from "../../../../../../../packages/email/src/email-outbox-dispatcher";

vi.mock(
  "../../../../../../../apps/web/src/server/email/email-runtime",
  () => ({ getEmailRuntime: vi.fn() }),
);
vi.mock(
  "../../../../../../../apps/web/src/server/email/dispatch-email-outbox-handler",
  () => ({
    handleDispatchEmailOutbox: vi.fn(
      async () => new Response(null, { status: 200 }),
    ),
  }),
);

describe("POST /api/internal/email/dispatch", () => {
  it("delegates to the protected email recovery handler", async () => {
    const dispatcher = new EmailOutboxDispatcher(
      {
        claimPendingOutbox: vi.fn(),
        markOutboxPublished: vi.fn(),
        releaseOutboxClaim: vi.fn(),
      },
      { publish: vi.fn() },
      {
        applicationBaseUrl: "https://app.studiocar.test",
        batchSize: 20,
        claimTtlMilliseconds: 30_000,
        retryBaseMilliseconds: 1_000,
        retryMaximumMilliseconds: 60_000,
      },
    );
    const dispatchToken = "email-dispatch-token-at-least-32-characters";
    vi.mocked(getEmailRuntime).mockReturnValue({ dispatchToken, dispatcher });
    const request = new Request(
      "https://app.studiocar.test/api/internal/email/dispatch",
      { method: "POST" },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(handleDispatchEmailOutbox).toHaveBeenCalledWith(
      request,
      dispatchToken,
      dispatcher,
    );
  });
});
