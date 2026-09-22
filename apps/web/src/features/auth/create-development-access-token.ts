import { DEVELOPMENT_OTP_TOKEN_PREFIX } from "./phone-sign-in.constants";

/**
 * Mirrors the development driver's token shape so the local flow exercises the
 * same verify endpoint as production without contacting a provider.
 */
export function createDevelopmentAccessToken(
  identifier: string,
  code: string,
): string {
  return `${DEVELOPMENT_OTP_TOKEN_PREFIX}${identifier}:${code}`;
}
