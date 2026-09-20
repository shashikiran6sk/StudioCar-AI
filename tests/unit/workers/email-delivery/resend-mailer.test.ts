import { describe, expect, it, vi } from "vitest";

import { ResendMailer } from "../../../../workers/email-delivery/src/resend-mailer";

const MAIL = {
  html: "<p>Ready</p>",
  idempotencyKey: "message-1",
  recipient: "dealer@example.com",
  subject: "Ready",
  text: "Ready",
};

describe("ResendMailer", () => {
  it("sends idempotently without exposing credentials in the payload", async () => {
    const request = vi.fn(
      async (_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Idempotency-Key")).toBe("message-1");
        expect(headers.get("Authorization")).toBe("Bearer secret-key");
        expect(String(init?.body)).not.toContain("secret-key");
        return new Response(JSON.stringify({ id: "email-1" }), { status: 200 });
      },
    );
    const mailer = new ResendMailer(
      {
        apiKey: "secret-key",
        from: "StudioCar <mail@example.com>",
        timeoutMilliseconds: 1_000,
      },
      request,
    );

    await expect(mailer.send(MAIL)).resolves.toEqual({
      kind: "DELIVERED",
      providerMessageId: "email-1",
    });
  });

  it("classifies rate limits as retryable and invalid requests as terminal", async () => {
    const rateLimited = new ResendMailer(
      { apiKey: "key", from: "mail@example.com", timeoutMilliseconds: 1_000 },
      vi.fn(async () => new Response(null, { status: 429 })),
    );
    const invalid = new ResendMailer(
      { apiKey: "key", from: "mail@example.com", timeoutMilliseconds: 1_000 },
      vi.fn(async () => new Response(null, { status: 400 })),
    );

    await expect(rateLimited.send(MAIL)).resolves.toMatchObject({
      retryable: true,
    });
    await expect(invalid.send(MAIL)).resolves.toMatchObject({
      retryable: false,
    });
  });

  it("retries only the concurrent form of an idempotency conflict", async () => {
    const concurrent = new ResendMailer(
      { apiKey: "key", from: "mail@example.com", timeoutMilliseconds: 1_000 },
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ name: "concurrent_idempotent_requests" }),
            { status: 409 },
          ),
      ),
    );
    const payloadConflict = new ResendMailer(
      { apiKey: "key", from: "mail@example.com", timeoutMilliseconds: 1_000 },
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ name: "invalid_idempotent_request" }),
            { status: 409 },
          ),
      ),
    );

    await expect(concurrent.send(MAIL)).resolves.toMatchObject({
      retryable: true,
    });
    await expect(payloadConflict.send(MAIL)).resolves.toMatchObject({
      retryable: false,
    });
  });
});
