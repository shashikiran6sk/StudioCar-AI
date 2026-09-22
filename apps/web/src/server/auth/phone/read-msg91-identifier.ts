import { toProviderMsisdn } from "./to-provider-msisdn";
import type { ProviderMsisdn } from "./phone-auth.types";

const IDENTIFIER_CLAIMS = [
  "identifier",
  "mobile",
  "number",
  "phone",
  "msisdn",
] as const;

function readJwtPayload(accessToken: string): Record<string, unknown> | null {
  const segments = accessToken.split(".");
  const payload = segments[1];
  if (segments.length !== 3 || !payload) return null;

  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    return decoded !== null && typeof decoded === "object"
      ? { ...decoded }
      : null;
  } catch {
    return null;
  }
}

/**
 * MSG91 names the verified handset either in the verification response or in
 * the access token's own claims, depending on widget configuration. Reading
 * both keeps verification working without widening what counts as proof: the
 * caller still refuses any identifier that is not the claimed number.
 */
export function readMsg91Identifier(
  body: Record<string, unknown>,
  accessToken: string,
): ProviderMsisdn | null {
  for (const claim of [...IDENTIFIER_CLAIMS, "message"]) {
    const identifier = toProviderMsisdn(body[claim]);
    if (identifier) return identifier;
  }

  const payload = readJwtPayload(accessToken);
  if (!payload) return null;

  for (const claim of IDENTIFIER_CLAIMS) {
    const identifier = toProviderMsisdn(payload[claim]);
    if (identifier) return identifier;
  }
  return null;
}
