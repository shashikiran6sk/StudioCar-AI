import {
  WEBHOOK_MAXIMUM_CANDIDATE_SIGNATURES,
  WEBHOOK_MAXIMUM_SIGNATURE_HEADER_LENGTH,
} from "./webhook-signature.constants";

export function parseWebhookSignatures(
  value: string,
  prefix: string,
): readonly string[] {
  if (value.length > WEBHOOK_MAXIMUM_SIGNATURE_HEADER_LENGTH) return [];

  return value
    .split(",")
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.startsWith(prefix))
    .slice(0, WEBHOOK_MAXIMUM_CANDIDATE_SIGNATURES)
    .map((candidate) => candidate.slice(prefix.length));
}
