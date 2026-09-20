import { describe, expect, it, vi } from "vitest";

import { handleDispatchEmailOutbox } from "../../../../apps/web/src/server/email/dispatch-email-outbox-handler";

const TOKEN = "email-dispatch-token-at-least-32-characters";

describe("handleDispatchEmailOutbox", () => {
  it("protects recovery and returns only its bounded dispatch summary", async () => {
    const dispatcher = {
      dispatch: vi.fn().mockResolvedValue({
        claimed: 2,
        failed: 1,
        published: 1,
      }),
    };
    const forbidden = await handleDispatchEmailOutbox(
      new Request("https://app.example.test/api/internal/email/dispatch"),
      TOKEN,
      dispatcher,
      () => "request-0001",
    );
    expect(forbidden.status).toBe(403);

    const accepted = await handleDispatchEmailOutbox(
      new Request("https://app.example.test/api/internal/email/dispatch", {
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
