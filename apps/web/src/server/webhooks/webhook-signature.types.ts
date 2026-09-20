import type { WebhookSignatureFailureReason } from "./webhook-signature.constants";

export interface VerifyWebhookSignatureInput {
  headers: Headers;
  rawBody: Uint8Array;
  receivedAt: Date;
}

export type WebhookSignatureVerificationResult =
  | { verified: true; timestampSeconds: number }
  | { verified: false; reason: WebhookSignatureFailureReason };

export interface WebhookSignatureVerifier {
  verify(
    input: VerifyWebhookSignatureInput,
  ): WebhookSignatureVerificationResult;
}

export interface HmacSha256WebhookSignatureOptions {
  signatureHeaderName: string;
  timestampHeaderName: string;
  signaturePrefix: string;
  secrets: readonly string[];
  toleranceSeconds: number;
}
