import { z } from "zod";

const EnvironmentNameSchema = z.enum(["development", "test", "production"]);

const PostgresUrlSchema = z.url().refine(
  (value) => /^postgres(?:ql)?:\/\//.test(value),
  "DATABASE_URL must use the postgres or postgresql protocol.",
);

const OAuthChallengeTtlSchema = z.coerce
  .number()
  .int()
  .min(60)
  .max(900)
  .default(600);

const PhoneOtpChallengeTtlSchema = z.coerce
  .number()
  .int()
  .min(60)
  .max(900)
  .default(600);

const PhoneOtpRateLimitWindowSchema = z.coerce
  .number()
  .int()
  .min(60)
  .max(3_600)
  .default(600);

const PhoneOtpLimitSchema = z.coerce.number().int().min(1);

export const PhoneAuthEnvironmentSchema = z
  .object({
    NODE_ENV: EnvironmentNameSchema.default("development"),
    DATABASE_URL: PostgresUrlSchema,
    SESSION_SECRET: z.string().min(32),
    MSG91_AUTH_KEY: z.string().trim().min(1),
    MSG91_TEMPLATE_ID: z.string().trim().min(1),
    MSG91_TIMEOUT_MS: z.coerce.number().int().min(500).max(15_000).default(5_000),
    PHONE_OTP_CHALLENGE_TTL_SECONDS: PhoneOtpChallengeTtlSchema,
    PHONE_OTP_RATE_LIMIT_WINDOW_SECONDS: PhoneOtpRateLimitWindowSchema,
    PHONE_OTP_SEND_MAX_PER_PHONE: PhoneOtpLimitSchema.max(10).default(3),
    PHONE_OTP_SEND_MAX_PER_IP: PhoneOtpLimitSchema.max(100).default(10),
    PHONE_OTP_VERIFY_MAX_PER_CHALLENGE: PhoneOtpLimitSchema.max(10).default(5),
    PHONE_OTP_VERIFY_MAX_PER_IP: PhoneOtpLimitSchema.max(300).default(30),
  })
  .strip();

export const GoogleAuthEnvironmentSchema = z
  .object({
    NODE_ENV: EnvironmentNameSchema.default("development"),
    DATABASE_URL: PostgresUrlSchema,
    SESSION_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string().trim().min(1),
    GOOGLE_CLIENT_SECRET: z.string().trim().min(1),
    GOOGLE_REDIRECT_URI: z.url(),
    OAUTH_CHALLENGE_TTL_SECONDS: OAuthChallengeTtlSchema,
  })
  .strip();

export const BackgroundRemovalProviderSchema = z.enum([
  "removebg",
  "fal",
  "birefnet",
]);

export const ServerEnvironmentSchema = z
  .object({
    NODE_ENV: EnvironmentNameSchema.default("development"),
    DATABASE_URL: PostgresUrlSchema,
    SESSION_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string().trim().min(1),
    GOOGLE_CLIENT_SECRET: z.string().trim().min(1),
    GOOGLE_REDIRECT_URI: z.url(),
    OAUTH_CHALLENGE_TTL_SECONDS: OAuthChallengeTtlSchema,
    MSG91_AUTH_KEY: z.string().trim().min(1),
    MSG91_TEMPLATE_ID: z.string().trim().min(1),
    MSG91_TIMEOUT_MS: z.coerce.number().int().min(500).max(15_000).default(5_000),
    PHONE_OTP_CHALLENGE_TTL_SECONDS: PhoneOtpChallengeTtlSchema,
    PHONE_OTP_RATE_LIMIT_WINDOW_SECONDS: PhoneOtpRateLimitWindowSchema,
    PHONE_OTP_SEND_MAX_PER_PHONE: PhoneOtpLimitSchema.max(10).default(3),
    PHONE_OTP_SEND_MAX_PER_IP: PhoneOtpLimitSchema.max(100).default(10),
    PHONE_OTP_VERIFY_MAX_PER_CHALLENGE: PhoneOtpLimitSchema.max(10).default(5),
    PHONE_OTP_VERIFY_MAX_PER_IP: PhoneOtpLimitSchema.max(300).default(30),
    RESEND_API_KEY: z.string().trim().min(1),
    EMAIL_FROM: z.string().trim().min(3),
    AWS_REGION: z.string().trim().min(1),
    S3_BUCKET: z.string().trim().min(3),
    SQS_IMAGE_QUEUE_URL: z.url(),
    SQS_EMAIL_QUEUE_URL: z.url(),
    BACKGROUND_REMOVAL_PROVIDER: BackgroundRemovalProviderSchema,
    REMOVEBG_API_KEY: z.string().trim().min(1).optional(),
    FAL_KEY: z.string().trim().min(1).optional(),
    SELF_HOSTED_BIREFNET_ENDPOINT: z.url().optional(),
    MAX_UPLOAD_BYTES: z.coerce
      .number()
      .int()
      .min(1_048_576)
      .max(100 * 1024 * 1024)
      .default(25 * 1024 * 1024),
    PRESIGNED_URL_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(900)
      .default(300),
  })
  .strip()
  .superRefine((value, context) => {
    const providerKey: Record<
      z.infer<typeof BackgroundRemovalProviderSchema>,
      keyof typeof value
    > = {
      removebg: "REMOVEBG_API_KEY",
      fal: "FAL_KEY",
      birefnet: "SELF_HOSTED_BIREFNET_ENDPOINT",
    };
    const requiredKey = providerKey[value.BACKGROUND_REMOVAL_PROVIDER];

    if (!value[requiredKey]) {
      context.addIssue({
        code: "custom",
        message: `${requiredKey} is required for ${value.BACKGROUND_REMOVAL_PROVIDER}.`,
        path: [requiredKey],
      });
    }
  });

export const ClientEnvironmentSchema = z
  .object({
    NODE_ENV: EnvironmentNameSchema.default("development"),
    NEXT_PUBLIC_APP_URL: z.url(),
  })
  .strip();

export type ServerEnvironment = z.infer<typeof ServerEnvironmentSchema>;
export type ClientEnvironment = z.infer<typeof ClientEnvironmentSchema>;
export type GoogleAuthEnvironment = z.infer<typeof GoogleAuthEnvironmentSchema>;
export type PhoneAuthEnvironment = z.infer<typeof PhoneAuthEnvironmentSchema>;

export function parseServerEnvironment(
  environment: Record<string, string | undefined>,
): ServerEnvironment {
  return ServerEnvironmentSchema.parse(environment);
}

export function parseClientEnvironment(
  environment: Record<string, string | undefined>,
): ClientEnvironment {
  return ClientEnvironmentSchema.parse(environment);
}

export function parseGoogleAuthEnvironment(
  environment: Record<string, string | undefined>,
): GoogleAuthEnvironment {
  return GoogleAuthEnvironmentSchema.parse(environment);
}

export function parsePhoneAuthEnvironment(
  environment: Record<string, string | undefined>,
): PhoneAuthEnvironment {
  return PhoneAuthEnvironmentSchema.parse(environment);
}
