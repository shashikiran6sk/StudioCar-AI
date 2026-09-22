import { Msg91WidgetVerificationSchema } from "@studiocar/contracts";

import {
  JSON_MEDIA_TYPE,
  MSG91_ACCEPT_HEADER,
  MSG91_ACCESS_TOKEN_FIELD,
  MSG91_AUTH_KEY_FIELD,
  MSG91_BASE_URL,
  MSG91_CONTENT_TYPE_HEADER,
  MSG91_SUCCESS_TYPE,
  MSG91_VERIFY_ACCESS_TOKEN_PATH,
} from "./phone-auth.constants";
import { readMsg91Identifier } from "./read-msg91-identifier";
import {
  PhoneOtpIdentificationStatus,
  type PhoneOtpIdentification,
  type PhoneOtpProvider,
} from "./phone-auth.types";

export interface Msg91WidgetOtpProviderOptions {
  authKey: string;
  timeoutMs: number;
  baseUrl?: string;
  httpClient?: typeof fetch;
}

/**
 * The server half of the MSG91 OTP widget. The browser runs `sendOtp` and
 * `verifyOtp`, so the code itself never reaches this application; what arrives
 * is the signed access token, which this adapter presents to MSG91 with the
 * server-only auth key to learn whose handset it proves.
 */
export class Msg91WidgetOtpProvider implements PhoneOtpProvider {
  public readonly driver = "msg91" as const;

  private readonly baseUrl: string;
  private readonly httpClient: typeof fetch;

  public constructor(private readonly options: Msg91WidgetOtpProviderOptions) {
    this.baseUrl = options.baseUrl ?? MSG91_BASE_URL;
    this.httpClient = options.httpClient ?? fetch;
  }

  public async identify(accessToken: string): Promise<PhoneOtpIdentification> {
    let response: Response;
    try {
      response = await this.httpClient(
        new URL(MSG91_VERIFY_ACCESS_TOKEN_PATH, this.baseUrl),
        {
          method: "POST",
          headers: {
            [MSG91_ACCEPT_HEADER]: JSON_MEDIA_TYPE,
            [MSG91_CONTENT_TYPE_HEADER]: JSON_MEDIA_TYPE,
          },
          body: JSON.stringify({
            [MSG91_AUTH_KEY_FIELD]: this.options.authKey,
            [MSG91_ACCESS_TOKEN_FIELD]: accessToken,
          }),
          signal: AbortSignal.timeout(this.options.timeoutMs),
        },
      );
    } catch {
      return { status: PhoneOtpIdentificationStatus.Unavailable };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return response.status >= 500
        ? { status: PhoneOtpIdentificationStatus.Unavailable }
        : { status: PhoneOtpIdentificationStatus.Rejected };
    }

    const parsed = Msg91WidgetVerificationSchema.safeParse(payload);
    if (!response.ok || !parsed.success) {
      return response.status >= 500
        ? { status: PhoneOtpIdentificationStatus.Unavailable }
        : { status: PhoneOtpIdentificationStatus.Rejected };
    }
    if (parsed.data.type !== MSG91_SUCCESS_TYPE) {
      return { status: PhoneOtpIdentificationStatus.Rejected };
    }

    const identifier = readMsg91Identifier(parsed.data, accessToken);
    if (!identifier) return { status: PhoneOtpIdentificationStatus.Rejected };

    return { status: PhoneOtpIdentificationStatus.Verified, identifier };
  }
}
