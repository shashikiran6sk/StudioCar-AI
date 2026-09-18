import { z } from "zod";

import { IndianPhoneNumberSchema } from "./phone-number";

const OAUTH_VALUE_PATTERN = /^[A-Za-z0-9_-]+$/;
const MINIMUM_OAUTH_VALUE_LENGTH = 43;
const MAXIMUM_OAUTH_VALUE_LENGTH = 128;
const MAXIMUM_RETURN_PATH_LENGTH = 2_048;
export const GOOGLE_AUTH_DEFAULT_RETURN_PATH = "/dashboard";

export enum GoogleIdentityResolutionStatus {
  Resolved = "resolved",
  LinkRequired = "link_required",
}

export const GoogleOAuthStateSchema = z
  .string()
  .min(MINIMUM_OAUTH_VALUE_LENGTH)
  .max(MAXIMUM_OAUTH_VALUE_LENGTH)
  .regex(OAUTH_VALUE_PATTERN);

export const GoogleAuthStartSchema = z
  .object({
    returnTo: z
      .string()
      .trim()
      .min(1)
      .max(MAXIMUM_RETURN_PATH_LENGTH)
      .refine(
        (value) =>
          value.startsWith("/") && !value.startsWith("//") && !value.includes("\\"),
        "Return path must be an application-relative path.",
      )
      .default(GOOGLE_AUTH_DEFAULT_RETURN_PATH),
  })
  .strict();

export const GoogleOAuthCallbackSchema = z.union([
  z
    .object({
      code: z.string().trim().min(1),
      state: GoogleOAuthStateSchema,
    })
    .strict(),
  z
    .object({
      error: z.string().trim().min(1).max(120),
      error_description: z.string().trim().max(1_000).optional(),
      state: GoogleOAuthStateSchema.optional(),
    })
    .strict(),
]);

export const GoogleOAuthChallengePayloadSchema = z
  .object({
    codeVerifier: z
      .string()
      .min(MINIMUM_OAUTH_VALUE_LENGTH)
      .max(MAXIMUM_OAUTH_VALUE_LENGTH)
      .regex(OAUTH_VALUE_PATTERN),
    nonce: z
      .string()
      .min(MINIMUM_OAUTH_VALUE_LENGTH)
      .max(MAXIMUM_OAUTH_VALUE_LENGTH)
      .regex(OAUTH_VALUE_PATTERN),
  })
  .strict();

export const GoogleIdTokenClaimsSchema = z
  .object({
    iss: z.string().min(1),
    sub: z.string().min(1).max(255),
    aud: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
    nonce: GoogleOAuthStateSchema,
    email: z.email().trim().toLowerCase(),
    email_verified: z.literal(true),
    name: z.string().trim().min(1).max(120).optional(),
  })
  .strip();

export const GoogleIdentitySchema = z
  .object({
    providerSubject: z.string().min(1).max(255),
    email: z.email().trim().toLowerCase(),
    displayName: z.string().trim().min(1).max(120).nullable(),
  })
  .strict();

export const AuthUserSchema = z
  .object({
    id: z.string().min(1),
    displayName: z.string().nullable(),
    primaryEmail: z.string().nullable(),
    primaryPhone: z.string().nullable(),
  })
  .strict();

export const GoogleIdentityResolutionSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal(GoogleIdentityResolutionStatus.Resolved),
      user: AuthUserSchema,
    })
    .strict(),
  z
    .object({ status: z.literal(GoogleIdentityResolutionStatus.LinkRequired) })
    .strict(),
]);

export const PhoneStartSchema = z
  .object({
    phoneNumber: IndianPhoneNumberSchema,
  })
  .strict();

export const PhoneVerifySchema = z
  .object({
    challengeId: z.uuid(),
    phoneNumber: IndianPhoneNumberSchema,
    otp: z.string().regex(/^\d{4,8}$/, "OTP must contain 4 to 8 digits."),
  })
  .strict();

export enum PhoneAuthenticationStatus {
  ChallengeSent = "challenge_sent",
  Authenticated = "authenticated",
}

export enum PhoneOtpChallengeCreationStatus {
  Created = "created",
  RateLimited = "rate_limited",
}

export enum PhoneOtpVerificationClaimStatus {
  Claimed = "claimed",
  InvalidChallenge = "invalid_challenge",
  Expired = "expired",
  TooManyAttempts = "too_many_attempts",
  RateLimited = "rate_limited",
}

export enum PhoneOtpCompletionStatus {
  Resolved = "resolved",
  LinkRequired = "link_required",
  InvalidChallenge = "invalid_challenge",
}

export interface CreatePhoneOtpChallengeCommand {
  phoneNumber: string;
  phoneHash: string;
  browserBindingHash: string;
  requestIpHash: string;
  now: Date;
  expiresAt: Date;
  windowStart: Date;
  maxPerPhone: number;
  maxPerIp: number;
}

export type CreatePhoneOtpChallengeResult =
  | {
      status: PhoneOtpChallengeCreationStatus.Created;
      challenge: { id: string; expiresAt: Date };
    }
  | {
      status: PhoneOtpChallengeCreationStatus.RateLimited;
      retryAt: Date;
    };

export interface ClaimPhoneOtpVerificationCommand {
  challengeId: string;
  phoneNumber: string;
  browserBindingHash: string;
  requestIpHash: string;
  now: Date;
  windowStart: Date;
  maxAttempts: number;
  maxPerIp: number;
}

export type ClaimPhoneOtpVerificationResult =
  | {
      status: PhoneOtpVerificationClaimStatus.Claimed;
      attemptId: string;
      phoneNumber: string;
      providerAlreadyVerified: boolean;
    }
  | {
      status:
        | PhoneOtpVerificationClaimStatus.InvalidChallenge
        | PhoneOtpVerificationClaimStatus.Expired
        | PhoneOtpVerificationClaimStatus.TooManyAttempts;
    }
  | {
      status: PhoneOtpVerificationClaimStatus.RateLimited;
      retryAt: Date;
    };

export interface CompletePhoneOtpCommand {
  challengeId: string;
  attemptId: string;
  phoneNumber: string;
  browserBindingHash: string;
  tokenHash: string;
  sessionExpiresAt: Date;
  authenticatedAt: Date;
}

export type PhoneOtpCompletionResult =
  | {
      status: PhoneOtpCompletionStatus.Resolved;
      session: {
        id: string;
        userId: string;
        expiresAt: Date;
        user: AuthUser;
      };
    }
  | { status: PhoneOtpCompletionStatus.LinkRequired }
  | { status: PhoneOtpCompletionStatus.InvalidChallenge };

export const PhoneStartResponseSchema = z
  .object({
    status: z.literal(PhoneAuthenticationStatus.ChallengeSent),
    challengeId: z.uuid(),
    expiresAt: z.iso.datetime(),
  })
  .strict();

export const PhoneVerifyResponseSchema = z
  .object({
    status: z.literal(PhoneAuthenticationStatus.Authenticated),
    user: AuthUserSchema,
  })
  .strict();

export const Msg91OtpResponseSchema = z
  .object({
    type: z.string().trim().toLowerCase(),
    message: z.string().trim().optional(),
    request_id: z.string().trim().min(1).optional(),
  })
  .loose();

export const LogoutSchema = z
  .object({
    allSessions: z.boolean().default(false),
  })
  .strict();

export type PhoneStart = z.infer<typeof PhoneStartSchema>;
export type PhoneVerify = z.infer<typeof PhoneVerifySchema>;
export type PhoneStartResponse = z.infer<typeof PhoneStartResponseSchema>;
export type PhoneVerifyResponse = z.infer<typeof PhoneVerifyResponseSchema>;
export type Logout = z.infer<typeof LogoutSchema>;
export type GoogleAuthStart = z.infer<typeof GoogleAuthStartSchema>;
export type GoogleOAuthCallback = z.infer<typeof GoogleOAuthCallbackSchema>;
export type GoogleOAuthChallengePayload = z.infer<
  typeof GoogleOAuthChallengePayloadSchema
>;
export type GoogleIdTokenClaims = z.infer<typeof GoogleIdTokenClaimsSchema>;
export type GoogleIdentity = z.infer<typeof GoogleIdentitySchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type GoogleIdentityResolution = z.infer<
  typeof GoogleIdentityResolutionSchema
>;
