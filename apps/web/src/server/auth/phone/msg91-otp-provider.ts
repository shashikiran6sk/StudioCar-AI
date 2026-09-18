import { Msg91OtpResponseSchema } from "@studiocar/contracts";

import {
  JSON_MEDIA_TYPE,
  MSG91_ACCEPT_HEADER,
  MSG91_AUTH_HEADER,
  MSG91_BASE_URL,
  MSG91_ERROR_TYPE,
  MSG91_EXPIRED_MESSAGE_FRAGMENT,
  MSG91_INVALID_MESSAGE_FRAGMENTS,
  MSG91_SEND_PATH,
  MSG91_SUCCESS_TYPE,
  MSG91_VERIFY_PATH,
} from "./phone-auth.constants";
import {
  PhoneOtpProviderVerificationStatus,
  type PhoneOtpProvider,
} from "./phone-auth.types";

const PROVIDER_RESPONSE_ERROR = "MSG91 returned an unexpected response.";
const PROVIDER_REQUEST_ERROR = "MSG91 rejected the request.";

export class Msg91OtpProviderError extends Error {
  public constructor(
    message: string,
    public readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "Msg91OtpProviderError";
  }
}

export interface Msg91OtpProviderOptions {
  authKey: string;
  templateId: string;
  timeoutMs: number;
  baseUrl?: string;
  httpClient?: typeof fetch;
}

export class Msg91OtpProvider implements PhoneOtpProvider {
  private readonly baseUrl: string;
  private readonly httpClient: typeof fetch;

  public constructor(private readonly options: Msg91OtpProviderOptions) {
    this.baseUrl = options.baseUrl ?? MSG91_BASE_URL;
    this.httpClient = options.httpClient ?? fetch;
  }

  public async send(
    phoneNumber: string,
  ): Promise<{ providerRequestId: string | null }> {
    const url = new URL(MSG91_SEND_PATH, this.baseUrl);
    url.searchParams.set("template_id", this.options.templateId);
    url.searchParams.set("mobile", this.toMsg91PhoneNumber(phoneNumber));
    const response = await this.request(url, { method: "POST" });
    const payload = await this.parseResponse(response);

    if (!response.ok || payload.type !== MSG91_SUCCESS_TYPE) {
      throw new Msg91OtpProviderError(
        PROVIDER_REQUEST_ERROR,
        response.status === 429 || response.status >= 500,
      );
    }

    return { providerRequestId: payload.request_id ?? null };
  }

  public async verify(
    phoneNumber: string,
    otp: string,
  ): Promise<{ status: PhoneOtpProviderVerificationStatus }> {
    const url = new URL(MSG91_VERIFY_PATH, this.baseUrl);
    url.searchParams.set("mobile", this.toMsg91PhoneNumber(phoneNumber));
    url.searchParams.set("otp", otp);
    const response = await this.request(url, { method: "GET" });
    const payload = await this.parseResponse(response);
    const message = payload.message?.toLowerCase() ?? "";

    if (response.ok && payload.type === MSG91_SUCCESS_TYPE) {
      return { status: PhoneOtpProviderVerificationStatus.Verified };
    }

    if (
      response.ok &&
      payload.type === MSG91_ERROR_TYPE &&
      message.includes(MSG91_EXPIRED_MESSAGE_FRAGMENT)
    ) {
      return { status: PhoneOtpProviderVerificationStatus.Expired };
    }

    if (
      response.ok &&
      payload.type === MSG91_ERROR_TYPE &&
      MSG91_INVALID_MESSAGE_FRAGMENTS.some((fragment) => message.includes(fragment))
    ) {
      return { status: PhoneOtpProviderVerificationStatus.Invalid };
    }

    throw new Msg91OtpProviderError(
      PROVIDER_REQUEST_ERROR,
      response.status === 429 || response.status >= 500,
    );
  }

  private async request(url: URL, init: RequestInit): Promise<Response> {
    try {
      return await this.httpClient(url, {
        ...init,
        headers: {
          [MSG91_ACCEPT_HEADER]: JSON_MEDIA_TYPE,
          [MSG91_AUTH_HEADER]: this.options.authKey,
        },
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
    } catch (error) {
      throw new Msg91OtpProviderError(PROVIDER_REQUEST_ERROR, true, {
        cause: error,
      });
    }
  }

  private async parseResponse(response: Response) {
    let value: unknown;
    try {
      value = await response.json();
    } catch (error) {
      throw new Msg91OtpProviderError(PROVIDER_RESPONSE_ERROR, response.status >= 500, {
        cause: error,
      });
    }

    const parsed = Msg91OtpResponseSchema.safeParse(value);
    if (!parsed.success) {
      throw new Msg91OtpProviderError(
        PROVIDER_RESPONSE_ERROR,
        response.status >= 500,
      );
    }
    return parsed.data;
  }

  private toMsg91PhoneNumber(phoneNumber: string): string {
    return phoneNumber.startsWith("+") ? phoneNumber.slice(1) : phoneNumber;
  }
}
