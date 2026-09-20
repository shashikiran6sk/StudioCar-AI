import { createHmac } from "node:crypto";

import { parseWebhookSignatures } from "./parse-webhook-signatures";
import { parseWebhookTimestamp } from "./parse-webhook-timestamp";
import {
  MILLISECONDS_PER_SECOND,
  WEBHOOK_HMAC_ALGORITHM,
  WEBHOOK_HMAC_DIGEST_ENCODING,
  WEBHOOK_SIGNING_SEPARATOR,
  WebhookSignatureFailureReason,
} from "./webhook-signature.constants";
import { webhookSignatureIsValid } from "./webhook-signature-is-valid";
import {
  type HmacSha256WebhookSignatureOptions,
  type VerifyWebhookSignatureInput,
  type WebhookSignatureVerificationResult,
  type WebhookSignatureVerifier,
} from "./webhook-signature.types";
import { validateWebhookSignatureOptions } from "./validate-webhook-signature-options";

export class HmacSha256WebhookSignatureVerifier
  implements WebhookSignatureVerifier
{
  private readonly options: HmacSha256WebhookSignatureOptions;

  public constructor(options: HmacSha256WebhookSignatureOptions) {
    validateWebhookSignatureOptions(options);
    this.options = { ...options, secrets: [...options.secrets] };
  }

  public verify(
    input: VerifyWebhookSignatureInput,
  ): WebhookSignatureVerificationResult {
    const signatureHeader = input.headers.get(
      this.options.signatureHeaderName,
    );
    const timestampHeader = input.headers.get(
      this.options.timestampHeaderName,
    );
    if (!signatureHeader || !timestampHeader) {
      return {
        verified: false,
        reason: WebhookSignatureFailureReason.MissingHeaders,
      };
    }

    const timestampSeconds = parseWebhookTimestamp(timestampHeader);
    if (
      timestampSeconds === null ||
      Math.abs(
        input.receivedAt.getTime() -
          timestampSeconds * MILLISECONDS_PER_SECOND,
      ) >
        this.options.toleranceSeconds * MILLISECONDS_PER_SECOND
    ) {
      return {
        verified: false,
        reason: WebhookSignatureFailureReason.StaleTimestamp,
      };
    }

    const candidates = parseWebhookSignatures(
      signatureHeader,
      this.options.signaturePrefix,
    );
    const signingPayload = Buffer.concat([
      Buffer.from(timestampHeader, "utf8"),
      Buffer.from(WEBHOOK_SIGNING_SEPARATOR, "utf8"),
      Buffer.from(input.rawBody),
    ]);
    let verified = false;

    for (const secret of this.options.secrets) {
      const expected = createHmac(WEBHOOK_HMAC_ALGORITHM, secret)
        .update(signingPayload)
        .digest(WEBHOOK_HMAC_DIGEST_ENCODING);
      for (const candidate of candidates) {
        verified = webhookSignatureIsValid(candidate, expected) || verified;
      }
    }

    return verified
      ? { verified: true, timestampSeconds }
      : {
          verified: false,
          reason: WebhookSignatureFailureReason.InvalidSignature,
        };
  }
}
