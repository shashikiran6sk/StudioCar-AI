import {
  DEVELOPMENT_OTP_TOKEN_PREFIX,
  DEVELOPMENT_OTP_TOKEN_SEPARATOR,
} from "./phone-auth.constants";
import { toProviderMsisdn } from "./to-provider-msisdn";
import {
  PhoneOtpIdentificationStatus,
  type PhoneOtpIdentification,
  type PhoneOtpProvider,
} from "./phone-auth.types";

/**
 * Local and test driver. It sends no message and accepts one configured code,
 * so the widget flow can be exercised end to end without spending SMS balance.
 * Environment validation refuses it in production.
 */
export class DevelopmentOtpProvider implements PhoneOtpProvider {
  public readonly driver = "fake" as const;

  public constructor(private readonly devCode: string) {}

  public identify(accessToken: string): Promise<PhoneOtpIdentification> {
    return Promise.resolve(this.evaluate(accessToken));
  }

  private evaluate(accessToken: string): PhoneOtpIdentification {
    if (!accessToken.startsWith(DEVELOPMENT_OTP_TOKEN_PREFIX)) {
      return { status: PhoneOtpIdentificationStatus.Rejected };
    }

    const [rawIdentifier, code] = accessToken
      .slice(DEVELOPMENT_OTP_TOKEN_PREFIX.length)
      .split(DEVELOPMENT_OTP_TOKEN_SEPARATOR);
    if (code !== this.devCode) {
      return { status: PhoneOtpIdentificationStatus.Rejected };
    }

    const identifier = toProviderMsisdn(rawIdentifier);
    return identifier
      ? { status: PhoneOtpIdentificationStatus.Verified, identifier }
      : { status: PhoneOtpIdentificationStatus.Rejected };
  }
}
