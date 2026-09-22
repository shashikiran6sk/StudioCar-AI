import { parsePhoneAuthEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";
import { PrismaPhoneOtpChallengeRepository } from "../../db/repositories/phone-otp-challenge-repository";
import { PrismaPhoneOtpCompletionRepository } from "../../db/repositories/phone-otp-completion-repository";
import { PrismaSessionRepository } from "../../db/repositories/session-repository";

import { SensitiveIdentifierHasher } from "../hash-sensitive-identifier";
import { SessionService } from "../session-service";
import { createPhoneOtpBrowserBinding } from "./create-phone-otp-browser-binding";
import { Msg91OtpProvider } from "./msg91-otp-provider";
import type { PhoneOtpApplication } from "./phone-auth.types";
import { PhoneOtpService } from "./phone-otp-service";

let phoneOtpApplication: PhoneOtpApplication | undefined;

export function getPhoneOtpApplication(): PhoneOtpApplication {
  if (phoneOtpApplication) return phoneOtpApplication;

  const environment = parsePhoneAuthEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  const challenges = new PrismaPhoneOtpChallengeRepository(database);
  const completions = new PrismaPhoneOtpCompletionRepository(database);
  const provider = new Msg91OtpProvider({
    authKey: environment.MSG91_AUTH_KEY,
    templateId: environment.MSG91_TEMPLATE_ID,
    timeoutMs: environment.MSG91_TIMEOUT_MS,
  });
  const sessions = new SessionService(new PrismaSessionRepository(database));
  const identifierHasher = new SensitiveIdentifierHasher(
    environment.SESSION_SECRET,
  );

  phoneOtpApplication = new PhoneOtpService(
    challenges,
    completions,
    provider,
    sessions,
    identifierHasher,
    {
      challengeTtlSeconds: environment.PHONE_OTP_CHALLENGE_TTL_SECONDS,
      rateLimitWindowSeconds:
        environment.PHONE_OTP_RATE_LIMIT_WINDOW_SECONDS,
      sendMaxPerPhone: environment.PHONE_OTP_SEND_MAX_PER_PHONE,
      sendMaxPerIp: environment.PHONE_OTP_SEND_MAX_PER_IP,
      verifyMaxPerChallenge:
        environment.PHONE_OTP_VERIFY_MAX_PER_CHALLENGE,
      verifyMaxPerIp: environment.PHONE_OTP_VERIFY_MAX_PER_IP,
      generateBrowserBinding: createPhoneOtpBrowserBinding,
    },
  );

  return phoneOtpApplication;
}
