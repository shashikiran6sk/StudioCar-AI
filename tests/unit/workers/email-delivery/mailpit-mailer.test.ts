import { describe, expect, it, vi } from "vitest";

import { MailpitMailer } from "../../../../workers/email-delivery/src/mailpit-mailer";

const message = {
  messageId: "6f7f3a5f-6b0f-4a4f-9b7b-8b4e1d6a2c31",
  type: "PROCESSING_COMPLETED" as const,
  version: 1 as const,
  recipient: "dealer@studiocar.test",
  data: {
    portfolioUrl: "http://localhost:3000/inventory/vehicle-1",
    vehicleName: "2022 BMW 3 Series",
  },
};

function mailer(request: typeof fetch): MailpitMailer {
  return new MailpitMailer(
    {
      baseUrl: "http://mailpit:8025",
      from: "no-reply@studiocar.local",
      timeoutMilliseconds: 5_000,
    },
    request,
  );
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("MailpitMailer", () => {
  it("delivers to the local inbox and reports the message id", async () => {
    const request = vi.fn<typeof fetch>(async () =>
      jsonResponse({ ID: "local-1" }),
    );

    await expect(mailer(request).send(message)).resolves.toEqual({
      kind: "DELIVERED",
      providerMessageId: "local-1",
    });
    const [url, init] = request.mock.calls[0] ?? [];
    expect(String(url)).toBe("http://mailpit:8025/api/v1/send");
    expect(init?.method).toBe("POST");
  });

  it("sends from the configured address", async () => {
    const request = vi.fn<typeof fetch>(async () =>
      jsonResponse({ ID: "local-1" }),
    );
    await mailer(request).send(message);

    const body: unknown = JSON.parse(String(request.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      From: { Email: "no-reply@studiocar.local" },
    });
  });

  it("treats an unreachable inbox as retryable", async () => {
    const request = vi.fn<typeof fetch>(async () => {
      throw new Error("connection refused");
    });

    await expect(mailer(request).send(message)).resolves.toEqual({
      kind: "FAILED",
      errorCode: "mailpit_unreachable",
      retryable: true,
    });
  });

  it("treats a server fault as retryable and a rejection as terminal", async () => {
    await expect(
      mailer(vi.fn<typeof fetch>(async () => jsonResponse({}, 503))).send(
        message,
      ),
    ).resolves.toMatchObject({ kind: "FAILED", retryable: true });

    await expect(
      mailer(vi.fn<typeof fetch>(async () => jsonResponse({}, 400))).send(
        message,
      ),
    ).resolves.toMatchObject({ kind: "FAILED", retryable: false });
  });
});
