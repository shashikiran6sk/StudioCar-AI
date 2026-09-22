import {
  parsePhoneAuthEnvironment,
  parsePhoneOtpWidgetEnvironment,
  type PhoneAuthEnvironment,
} from "@studiocar/config";
import type { PhoneOtpWidget } from "@studiocar/contracts";
import { createDatabaseClient } from "@studiocar/database-runtime";

import { PrismaPhoneOtpChallengeRepository } from "../../db/repositories/phone-otp-challenge-repository";
import { PrismaPhoneOtpCompletionRepository } from "../../db/repositories/phone-otp-completion-repository";
import { PrismaSessionRepository } from "../../db/repositories/session-repository";
import { SensitiveIdentifierHasher } from "../hash-sensitive-identifier";
import { SessionService } from "../session-service";
import { createPhoneOtpBrowserBinding } from "./create-phone-otp-browser-binding";
import { describePhoneOtpWidget } from "./describe-phone-otp-widget";
import { DevelopmentOtpProvider } from "./development-otp-provider";
import { Msg91WidgetOtpProvider } from "./msg91-widget-otp-provider";
import type { PhoneOtpApplication, PhoneOtpProvider } from "./phone-auth.types";
import { PhoneOtpService } from "./phone-otp-service";

const MISSING_MSG91_AUTH_KEY_ERROR =
  "MSG91_AUTH_KEY is required when PHONE_OTP_DRIVER is msg91.";

let phoneOtpApplication: PhoneOtpApplication | undefined;
let phoneOtpWidget: PhoneOtpWidget | undefined;

function createProvider(
  environment: PhoneAuthEnvironment,
): PhoneOtpProvider {
  if (environment.PHONE_OTP_DRIVER === "fake") {
    return new DevelopmentOtpProvider(environment.PHONE_OTP_DEV_CODE);
  }

  const authKey = environment.MSG91_AUTH_KEY;
  if (!authKey) throw new Error(MISSING_MSG91_AUTH_KEY_ERROR);

  return new Msg91WidgetOtpProvider({
    authKey,
    timeoutMs: environment.MSG91_TIMEOUT_MS,
  });
}

export function getPhoneOtpApplication(): PhoneOtpApplication {
  if (phoneOtpApplication) return phoneOtpApplication;

  const environment = parsePhoneAuthEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  const sessions = new SessionService(new PrismaSessionRepository(database));

  phoneOtpApplication = new PhoneOtpService(
    new PrismaPhoneOtpChallengeRepository(database),
    new PrismaPhoneOtpCompletionRepository(database),
    createProvider(environment),
    sessions,
    new SensitiveIdentifierHasher(environment.SESSION_SECRET),
    {
      challengeTtlSeconds: environment.PHONE_OTP_CHALLENGE_TTL_SECONDS,
      rateLimitWindowSeconds: environment.PHONE_OTP_RATE_LIMIT_WINDOW_SECONDS,
      sendMaxPerPhone: environment.PHONE_OTP_SEND_MAX_PER_PHONE,
      sendMaxPerIp: environment.PHONE_OTP_SEND_MAX_PER_IP,
      verifyMaxPerChallenge: environment.PHONE_OTP_VERIFY_MAX_PER_CHALLENGE,
      verifyMaxPerIp: environment.PHONE_OTP_VERIFY_MAX_PER_IP,
      generateBrowserBinding: createPhoneOtpBrowserBinding,
    },
  );

  return phoneOtpApplication;
}

export function getPhoneOtpWidget(): PhoneOtpWidget {
  phoneOtpWidget ??= describePhoneOtpWidget(
    parsePhoneOtpWidgetEnvironment(process.env),
  );
  return phoneOtpWidget;
}
