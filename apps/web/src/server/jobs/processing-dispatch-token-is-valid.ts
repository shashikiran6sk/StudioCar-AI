import { timingSafeEqual } from "node:crypto";

import { hashAuthSecret } from "../auth/hash-auth-secret";
import {
  PROCESSING_AUTHORIZATION_HEADER,
  PROCESSING_BEARER_PREFIX,
} from "./processing-job.constants";

export function processingDispatchTokenIsValid(
  request: Request,
  expectedToken: string,
): boolean {
  const authorization = request.headers.get(PROCESSING_AUTHORIZATION_HEADER);
  if (!authorization?.startsWith(PROCESSING_BEARER_PREFIX)) return false;
  const candidate = authorization.slice(PROCESSING_BEARER_PREFIX.length);
  const candidateHash = Buffer.from(hashAuthSecret(candidate), "hex");
  const expectedHash = Buffer.from(hashAuthSecret(expectedToken), "hex");
  return timingSafeEqual(candidateHash, expectedHash);
}
