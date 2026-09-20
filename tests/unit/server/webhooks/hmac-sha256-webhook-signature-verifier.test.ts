import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { HmacSha256WebhookSignatureVerifier } from "../../../../apps/web/src/server/webhooks/hmac-sha256-webhook-signature-verifier";
import { WebhookSignatureFailureReason } from "../../../../apps/web/src/server/webhooks/webhook-signature.constants";

const ACTIVE_SECRET = "active-webhook-secret-at-least-32-bytes";
const PREVIOUS_SECRET = "previous-webhook-secret-at-least-32-bytes";
const TIMESTAMP = "1789905600";
const RECEIVED_AT = new Date("2026-09-20T12:00:00.000Z");
const RAW_BODY = new TextEncoder().encode('{ "event": "completed" }');

function signature(secret: string): string {
  return createHmac("sha256", secret)
    .update(Buffer.concat([Buffer.from(`${TIMESTAMP}.`), Buffer.from(RAW_BODY)]))
    .digest("hex");
}

function verifier(): HmacSha256WebhookSignatureVerifier {
  return new HmacSha256WebhookSignatureVerifier({
    signatureHeaderName: "webhook-signature",
    timestampHeaderName: "webhook-timestamp",
    signaturePrefix: "v1=",
    secrets: [ACTIVE_SECRET, PREVIOUS_SECRET],
    toleranceSeconds: 300,
  });
}

describe("HmacSha256WebhookSignatureVerifier", () => {
  it("verifies raw body bytes with an active or rotating secret", () => {
    const result = verifier().verify({
      headers: new Headers({
        "webhook-signature": `v1=${signature(PREVIOUS_SECRET)}`,
        "webhook-timestamp": TIMESTAMP,
      }),
      rawBody: RAW_BODY,
      receivedAt: RECEIVED_AT,
    });

    expect(result).toEqual({
      verified: true,
      timestampSeconds: 1_789_905_600,
    });
  });

  it("rejects missing headers, stale delivery, and body tampering", () => {
    const missing = verifier().verify({
      headers: new Headers(),
      rawBody: RAW_BODY,
      receivedAt: RECEIVED_AT,
    });
    const stale = verifier().verify({
      headers: new Headers({
        "webhook-signature": `v1=${signature(ACTIVE_SECRET)}`,
        "webhook-timestamp": TIMESTAMP,
      }),
      rawBody: RAW_BODY,
      receivedAt: new Date("2026-09-20T12:06:00.000Z"),
    });
    const tampered = verifier().verify({
      headers: new Headers({
        "webhook-signature": `v1=${signature(ACTIVE_SECRET)}`,
        "webhook-timestamp": TIMESTAMP,
      }),
      rawBody: new TextEncoder().encode('{"event":"failed"}'),
      receivedAt: RECEIVED_AT,
    });

    expect(missing).toEqual({
      verified: false,
      reason: WebhookSignatureFailureReason.MissingHeaders,
    });
    expect(stale).toEqual({
      verified: false,
      reason: WebhookSignatureFailureReason.StaleTimestamp,
    });
    expect(tampered).toEqual({
      verified: false,
      reason: WebhookSignatureFailureReason.InvalidSignature,
    });
  });
});
