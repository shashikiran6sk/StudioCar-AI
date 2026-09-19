import { z } from "zod";

const EnvironmentNameSchema = z.enum(["development", "test", "production"]);
const DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_CONFIGURED_UPLOAD_BYTES = DEFAULT_MAX_UPLOAD_BYTES;
const DEFAULT_PRESIGNED_URL_TTL_SECONDS = 300;
const DEFAULT_MAX_IMAGE_DIMENSION = 16_384;
const DEFAULT_MAX_IMAGE_PIXELS = 100_000_000;
const DEFAULT_PROCESSING_OUTBOX_BATCH_SIZE = 20;
const DEFAULT_PROCESSING_OUTBOX_CLAIM_TTL_MS = 30_000;
const DEFAULT_PROCESSING_OUTBOX_RETRY_BASE_MS = 1_000;
const DEFAULT_PROCESSING_OUTBOX_RETRY_MAX_MS = 60_000;
const DEFAULT_IMAGE_WORKER_CLAIM_TTL_MS = 120_000;
const DEFAULT_IMAGE_WORKER_RETRY_BASE_MS = 5_000;
const DEFAULT_IMAGE_WORKER_RETRY_MAX_MS = 300_000;
const DEFAULT_REMOVEBG_TIMEOUT_MS = 60_000;
const DEFAULT_PROVIDER_INPUT_BYTES = 22 * 1024 * 1024;
const DEFAULT_PROVIDER_OUTPUT_BYTES = 100 * 1024 * 1024;
const DEFAULT_WORKER_IMAGE_PIXELS = 50_000_000;
const DEFAULT_PREVIEW_MAX_WIDTH = 720;

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

export const SessionEnvironmentSchema = z
  .object({
    DATABASE_URL: PostgresUrlSchema,
  })
  .strip();

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

const UploadConfigurationSchema = z.object({
  AWS_REGION: z.string().trim().min(1),
  S3_BUCKET: z.string().trim().min(3).max(63),
  MAX_UPLOAD_BYTES: z.coerce
    .number()
    .int()
    .min(1_048_576)
    .max(MAX_CONFIGURED_UPLOAD_BYTES)
    .default(DEFAULT_MAX_UPLOAD_BYTES),
  PRESIGNED_URL_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(900)
    .default(DEFAULT_PRESIGNED_URL_TTL_SECONDS),
  MAX_IMAGE_DIMENSION: z.coerce
    .number()
    .int()
    .min(1_024)
    .max(65_535)
    .default(DEFAULT_MAX_IMAGE_DIMENSION),
  MAX_IMAGE_PIXELS: z.coerce
    .number()
    .int()
    .min(1_000_000)
    .max(500_000_000)
    .default(DEFAULT_MAX_IMAGE_PIXELS),
});

export const UploadEnvironmentSchema = z
  .object({
    DATABASE_URL: PostgresUrlSchema,
    ...UploadConfigurationSchema.shape,
  })
  .strip();

export const BackgroundRemovalProviderSchema = z.enum([
  "removebg",
  "fal",
  "birefnet",
]);

export const ProcessingEnvironmentSchema = z
  .object({
    DATABASE_URL: PostgresUrlSchema,
    AWS_REGION: z.string().trim().min(1),
    SQS_IMAGE_QUEUE_URL: z.url(),
    BACKGROUND_REMOVAL_PROVIDER: BackgroundRemovalProviderSchema,
    PROCESSING_DISPATCH_TOKEN: z.string().min(32),
    PROCESSING_OUTBOX_BATCH_SIZE: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(DEFAULT_PROCESSING_OUTBOX_BATCH_SIZE),
    PROCESSING_OUTBOX_CLAIM_TTL_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(300_000)
      .default(DEFAULT_PROCESSING_OUTBOX_CLAIM_TTL_MS),
    PROCESSING_OUTBOX_RETRY_BASE_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(3_600_000)
      .default(DEFAULT_PROCESSING_OUTBOX_RETRY_BASE_MS),
    PROCESSING_OUTBOX_RETRY_MAX_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(3_600_000)
      .default(DEFAULT_PROCESSING_OUTBOX_RETRY_MAX_MS),
  })
  .strip()
  .refine(
    (value) =>
      value.PROCESSING_OUTBOX_RETRY_MAX_MS >=
      value.PROCESSING_OUTBOX_RETRY_BASE_MS,
    {
      message: "Processing retry maximum must be at least the retry base.",
      path: ["PROCESSING_OUTBOX_RETRY_MAX_MS"],
    },
  );

export const ImageWorkerEnvironmentSchema = z
  .object({
    DATABASE_URL: PostgresUrlSchema,
    AWS_REGION: z.string().trim().min(1),
    S3_BUCKET: z.string().trim().min(3).max(63),
    BACKGROUND_REMOVAL_PROVIDER: BackgroundRemovalProviderSchema,
    REMOVEBG_API_KEY: z.string().trim().min(1).optional(),
    FAL_KEY: z.string().trim().min(1).optional(),
    SELF_HOSTED_BIREFNET_ENDPOINT: z.url().optional(),
    IMAGE_WORKER_CLAIM_TTL_MS: z.coerce
      .number()
      .int()
      .min(30_000)
      .max(900_000)
      .default(DEFAULT_IMAGE_WORKER_CLAIM_TTL_MS),
    PROCESSING_RETRY_BASE_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(3_600_000)
      .default(DEFAULT_IMAGE_WORKER_RETRY_BASE_MS),
    PROCESSING_RETRY_MAX_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(3_600_000)
      .default(DEFAULT_IMAGE_WORKER_RETRY_MAX_MS),
    REMOVEBG_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(300_000)
      .default(DEFAULT_REMOVEBG_TIMEOUT_MS),
    MAX_PROVIDER_INPUT_BYTES: z.coerce
      .number()
      .int()
      .min(1_048_576)
      .max(DEFAULT_PROVIDER_INPUT_BYTES)
      .default(DEFAULT_PROVIDER_INPUT_BYTES),
    MAX_PROVIDER_OUTPUT_BYTES: z.coerce
      .number()
      .int()
      .min(1_048_576)
      .max(250 * 1024 * 1024)
      .default(DEFAULT_PROVIDER_OUTPUT_BYTES),
    MAX_WORKER_IMAGE_PIXELS: z.coerce
      .number()
      .int()
      .min(1_000_000)
      .max(DEFAULT_WORKER_IMAGE_PIXELS)
      .default(DEFAULT_WORKER_IMAGE_PIXELS),
    PREVIEW_MAX_WIDTH: z.coerce
      .number()
      .int()
      .min(320)
      .max(2_048)
      .default(DEFAULT_PREVIEW_MAX_WIDTH),
  })
  .strip()
  .superRefine((value, context) => {
    if (value.PROCESSING_RETRY_MAX_MS < value.PROCESSING_RETRY_BASE_MS) {
      context.addIssue({
        code: "custom",
        message: "Processing retry maximum must be at least the retry base.",
        path: ["PROCESSING_RETRY_MAX_MS"],
      });
    }

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
    ...UploadConfigurationSchema.shape,
    SQS_IMAGE_QUEUE_URL: z.url(),
    SQS_EMAIL_QUEUE_URL: z.url(),
    BACKGROUND_REMOVAL_PROVIDER: BackgroundRemovalProviderSchema,
    REMOVEBG_API_KEY: z.string().trim().min(1).optional(),
    FAL_KEY: z.string().trim().min(1).optional(),
    SELF_HOSTED_BIREFNET_ENDPOINT: z.url().optional(),
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
export type SessionEnvironment = z.infer<typeof SessionEnvironmentSchema>;
export type UploadEnvironment = z.infer<typeof UploadEnvironmentSchema>;
export type ProcessingEnvironment = z.infer<
  typeof ProcessingEnvironmentSchema
>;
export type ImageWorkerEnvironment = z.infer<
  typeof ImageWorkerEnvironmentSchema
>;
export type BackgroundRemovalProvider = z.infer<
  typeof BackgroundRemovalProviderSchema
>;

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

export function parseSessionEnvironment(
  environment: Record<string, string | undefined>,
): SessionEnvironment {
  return SessionEnvironmentSchema.parse(environment);
}

export function parseUploadEnvironment(
  environment: Record<string, string | undefined>,
): UploadEnvironment {
  return UploadEnvironmentSchema.parse(environment);
}

export function parseProcessingEnvironment(
  environment: Record<string, string | undefined>,
): ProcessingEnvironment {
  return ProcessingEnvironmentSchema.parse(environment);
}

export function parseImageWorkerEnvironment(
  environment: Record<string, string | undefined>,
): ImageWorkerEnvironment {
  return ImageWorkerEnvironmentSchema.parse(environment);
}
