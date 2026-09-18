import { createHash } from "node:crypto";

const AUTH_SECRET_DIGEST = "sha256";
const AUTH_SECRET_ENCODING = "hex";

export function hashAuthSecret(value: string): string {
  return createHash(AUTH_SECRET_DIGEST)
    .update(value, "utf8")
    .digest(AUTH_SECRET_ENCODING);
}
