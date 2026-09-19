import { describe, expect, it, vi } from "vitest";

import { handleDispatchProcessingOutbox } from "../../../../apps/web/src/server/jobs/dispatch-processing-outbox-handler";
import type { ProcessingDispatchPort } from "../../../../apps/web/src/server/jobs/processing-job.types";

const TOKEN = "processing-dispatch-token-at-least-32-characters";

describe("handleDispatchProcessingOutbox", () => {
  it("protects recovery and returns its bounded dispatch summary", async () => {
    const dispatcher: ProcessingDispatchPort = {
      dispatch: vi.fn().mockResolvedValue({
        claimed: 2,
        failed: 1,
        published: 1,
      }),
    };
    const forbidden = await handleDispatchProcessingOutbox(
      new Request("https://app.example.test/api/internal/jobs/dispatch"),
      TOKEN,
      dispatcher,
      () => "request-0001",
    );
    expect(forbidden.status).toBe(403);

    const accepted = await handleDispatchProcessingOutbox(
      new Request("https://app.example.test/api/internal/jobs/dispatch", {
        headers: { authorization: `Bearer ${TOKEN}` },
      }),
      TOKEN,
      dispatcher,
    );
    expect(accepted.status).toBe(200);
    await expect(accepted.json()).resolves.toEqual({
      claimed: 2,
      failed: 1,
      published: 1,
    });
  });
});
