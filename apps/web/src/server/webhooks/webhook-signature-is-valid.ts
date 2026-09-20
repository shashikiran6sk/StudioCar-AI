import { timingSafeEqual } from "node:crypto";

import { WEBHOOK_SHA256_HEX_LENGTH } from "./webhook-signature.constants";

const SHA256_HEX_PATTERN = /^[a-f\d]+$/i;

export function webhookSignatureIsValid(
  candidate: string,
  expected: string,
): boolean {
  if (
    candidate.length !== WEBHOOK_SHA256_HEX_LENGTH ||
    !SHA256_HEX_PATTERN.test(candidate)
  ) {
    return false;
  }

  const candidateBytes = Buffer.from(candidate, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  return (
    candidateBytes.length === expectedBytes.length &&
    timingSafeEqual(candidateBytes, expectedBytes)
  );
}
