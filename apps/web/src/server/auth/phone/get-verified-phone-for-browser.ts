import { cookies } from "next/headers";

import { getPhoneAccountService } from "./phone-auth-runtime";
import { phoneOtpCookieName } from "./phone-otp-cookie";
import {
  readVerifiedPhoneChallengeId,
  verifiedPhoneCookieName,
} from "./verified-phone-cookie";

export async function getVerifiedPhoneForBrowser(): Promise<string | null> {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  const candidate = cookieStore.get(verifiedPhoneCookieName(isProduction))?.value;
  const challengeId = readVerifiedPhoneChallengeId(candidate);
  const browserBinding = cookieStore.get(phoneOtpCookieName(isProduction))?.value;
  if (!challengeId || !browserBinding) return null;
  const verified = await getPhoneAccountService().findVerified(
    challengeId,
    browserBinding,
  );
  return verified?.phoneNumber ?? null;
}
