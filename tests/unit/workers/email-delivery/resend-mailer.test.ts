import { describe, expect, it, vi } from "vitest";

import { ResendMailer } from "../../../../workers/email-delivery/src/resend-mailer";

const MESSAGE = {
  data: {
    portfolioUrl: "https://app.studiocar.example/inventory/vehicle-1",
    vehicleName: "Vehicle one",
  },
  messageId: "4bb7fa89-c907-4458-9786-8aafc2235728",
  recipient: "dealer@example.com",
  type: "PROCESSING_COMPLETED",
  version: 1,
} satisfies Parameters<ResendMailer["send"]>[0];

describe("ResendMailer", () => {
  it("sends idempotently without exposing credentials in the payload", async () => {
    const request = vi.fn(
      async (_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Idempotency-Key")).toBe(MESSAGE.messageId);
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

    await expect(mailer.send(MESSAGE)).resolves.toEqual({
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

    await expect(rateLimited.send(MESSAGE)).resolves.toMatchObject({
      retryable: true,
    });
    await expect(invalid.send(MESSAGE)).resolves.toMatchObject({
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

    await expect(concurrent.send(MESSAGE)).resolves.toMatchObject({
      retryable: true,
    });
    await expect(payloadConflict.send(MESSAGE)).resolves.toMatchObject({
      retryable: false,
    });
  });
});
