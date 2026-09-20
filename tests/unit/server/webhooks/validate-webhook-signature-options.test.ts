import { describe, expect, it } from "vitest";

import { validateWebhookSignatureOptions } from "../../../../apps/web/src/server/webhooks/validate-webhook-signature-options";

const SECRET = "webhook-secret-at-least-thirty-two-bytes";

describe("validateWebhookSignatureOptions", () => {
  it("accepts bounded rotation and rejects unsafe secrets or header names", () => {
    expect(() =>
      validateWebhookSignatureOptions({
        signatureHeaderName: "webhook-signature",
        timestampHeaderName: "webhook-timestamp",
        signaturePrefix: "v1=",
        secrets: [SECRET, `${SECRET}-previous`],
        toleranceSeconds: 300,
      }),
    ).not.toThrow();
    expect(() =>
      validateWebhookSignatureOptions({
        signatureHeaderName: "invalid header",
        timestampHeaderName: "webhook-timestamp",
        signaturePrefix: "v1=",
        secrets: ["short"],
        toleranceSeconds: 0,
      }),
    ).toThrow("Webhook signature verifier options are invalid.");
  });
});
