import { timingSafeEqual } from "node:crypto";

import { hashAuthSecret } from "../auth/hash-auth-secret";
import {
  INTERNAL_AUTHORIZATION_HEADER,
  INTERNAL_BEARER_PREFIX,
} from "./internal-dispatch.constants";

export function dispatchTokenIsValid(
  request: Request,
  expectedToken: string,
): boolean {
  const authorization = request.headers.get(INTERNAL_AUTHORIZATION_HEADER);
  if (!authorization?.startsWith(INTERNAL_BEARER_PREFIX)) return false;
  const candidate = authorization.slice(INTERNAL_BEARER_PREFIX.length);
  const candidateHash = Buffer.from(hashAuthSecret(candidate), "hex");
  const expectedHash = Buffer.from(hashAuthSecret(expectedToken), "hex");
  return timingSafeEqual(candidateHash, expectedHash);
}
