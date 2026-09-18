import { z } from "zod";

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

const IndianPhoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, "Enter an Indian phone number in E.164 format.");

export const PhoneStartSchema = z
  .object({
    phoneNumber: IndianPhoneSchema,
  })
  .strict();

export const PhoneVerifySchema = z
  .object({
    challengeId: z.uuid(),
    phoneNumber: IndianPhoneSchema,
    otp: z.string().regex(/^\d{4,8}$/, "OTP must contain 4 to 8 digits."),
  })
  .strict();

export const LogoutSchema = z
  .object({
    allSessions: z.boolean().default(false),
  })
  .strict();

export type PhoneStart = z.infer<typeof PhoneStartSchema>;
export type PhoneVerify = z.infer<typeof PhoneVerifySchema>;
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
