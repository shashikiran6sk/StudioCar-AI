/**
 * Application-level reasons a phone verification step failed. Provider codes
 * are translated into these at the adapter edge so the sign-in surface never
 * depends on MSG91's own vocabulary.
 */
export enum PhoneOtpErrorCategory {
  InvalidOtp = "INVALID_OTP",
  OtpExpired = "OTP_EXPIRED",
  TooManyAttempts = "TOO_MANY_ATTEMPTS",
  RateLimited = "RATE_LIMITED",
  OtpSessionExpired = "OTP_SESSION_EXPIRED",
  InvalidRequest = "INVALID_REQUEST",
  NetworkError = "NETWORK_ERROR",
  ServiceUnavailable = "SERVICE_UNAVAILABLE",
  UnknownProviderError = "UNKNOWN_PROVIDER_ERROR",
}

export enum PhoneOtpOperation {
  Send = "send",
  Resend = "resend",
  Verify = "verify",
}

export interface PhoneOtpErrorDetails {
  providerCode?: number | undefined;
  retryAfterSeconds?: number | undefined;
}
