import type {
  PhoneOtpErrorCategory,
  PhoneOtpErrorDetails,
  PhoneOtpOperation,
} from "./phone-otp-error.types";

/**
 * A normalized verification failure. `message` is always safe to show a
 * person; the provider's own wording is never used as the message.
 */
export class PhoneOtpError extends Error {
  public readonly providerCode: number | undefined;
  public readonly retryAfterSeconds: number | undefined;

  public constructor(
    public readonly category: PhoneOtpErrorCategory,
    public readonly operation: PhoneOtpOperation,
    message: string,
    details: PhoneOtpErrorDetails = {},
  ) {
    super(message);
    this.name = "PhoneOtpError";
    this.providerCode = details.providerCode;
    this.retryAfterSeconds = details.retryAfterSeconds;
  }
}
