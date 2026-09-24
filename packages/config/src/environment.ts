import { z } from "zod";

import { emptyAsUnset } from "./empty-as-unset";

import { AppEnvironment } from "./app-environment";
import { AppEnvironmentSchema } from "./app-environment-schema";
import { applyEnvironmentProfile } from "./apply-environment-profile";
import {
  refineS3Connection,
  refineSqsConnection,
  S3ConnectionSchema,
  SqsConnectionSchema,
} from "./aws-connection";
import { getEnvironmentProfile } from "./environment-profiles";
import {
  BackgroundRemovalProviderSchema,
  EmailDriverSchema,
  GoogleAuthDriverSchema,
  PhoneOtpDriverSchema,
  WorkerRuntime,
} from "./provider-drivers";
import { refineDriverSelection } from "./refine-driver-selection";
import { refineEnvironmentIsolation } from "./refine-environment-isolation";

export {
  BackgroundRemovalProviderSchema,
  EmailDriverSchema,
  GoogleAuthDriverSchema,
  PhoneOtpDriverSchema,
  type BackgroundRemovalProvider,
  type EmailDriver,
  type GoogleAuthDriver,
  type PhoneOtpDriver,
} from "./provider-drivers";

/**
 * `NODE_ENV` keeps its ordinary Node.js meaning and selects nothing here. The
 * client schema below only reports it; every StudioCar choice reads `APP_ENV`.
 */
const NodeEnvironmentSchema = z.enum(["development", "test", "production"]);
const DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_CONFIGURED_UPLOAD_BYTES = DEFAULT_MAX_UPLOAD_BYTES;
const DEFAULT_PRESIGNED_URL_TTL_SECONDS = 300;
const DEFAULT_MAX_IMAGE_DIMENSION = 16_384;
const DEFAULT_MAX_IMAGE_PIXELS = 100_000_000;
const DEFAULT_PROCESSING_OUTBOX_BATCH_SIZE = 20;
const DEFAULT_PROCESSING_OUTBOX_CLAIM_TTL_MS = 30_000;
const DEFAULT_PROCESSING_OUTBOX_RETRY_BASE_MS = 1_000;
const DEFAULT_PROCESSING_OUTBOX_RETRY_MAX_MS = 60_000;
const DEFAULT_EMAIL_OUTBOX_BATCH_SIZE = 20;
const DEFAULT_EMAIL_OUTBOX_CLAIM_TTL_MS = 30_000;
const DEFAULT_EMAIL_OUTBOX_RETRY_BASE_MS = 1_000;
const DEFAULT_EMAIL_OUTBOX_RETRY_MAX_MS = 60_000;
const DEFAULT_EMAIL_DELIVERY_CLAIM_TTL_MS = 45_000;
const DEFAULT_IMAGE_WORKER_CLAIM_TTL_MS = 120_000;
const DEFAULT_IMAGE_WORKER_RETRY_BASE_MS = 5_000;
const DEFAULT_IMAGE_WORKER_RETRY_MAX_MS = 300_000;
const DEFAULT_REMOVEBG_TIMEOUT_MS = 60_000;
const DEFAULT_PROVIDER_INPUT_BYTES = 22 * 1024 * 1024;
const DEFAULT_PROVIDER_OUTPUT_BYTES = 100 * 1024 * 1024;
const DEFAULT_WORKER_IMAGE_PIXELS = 50_000_000;
const DEFAULT_PREVIEW_MAX_WIDTH = 720;
const DEFAULT_COMMAND_RATE_LIMIT_WINDOW_SECONDS = 60;
const DEFAULT_UPLOAD_PRESIGN_MAX_PER_WINDOW = 120;
const DEFAULT_PROCESSING_BATCH_MAX_PER_WINDOW = 20;
const DEFAULT_LIFECYCLE_CLEANUP_BATCH_SIZE = 100;
const DEFAULT_SESSION_RETENTION_DAYS = 30;
const DEFAULT_AUTH_CHALLENGE_RETENTION_DAYS = 7;
const DEFAULT_COMMAND_RATE_LIMIT_RETENTION_HOURS = 24;
const DEFAULT_STORAGE_CLEANUP_BATCH_SIZE = 10;
const DEFAULT_ABANDONED_UPLOAD_RETENTION_HOURS = 24;
const DEFAULT_STORAGE_DELETION_CLAIM_TTL_MS = 120_000;
const DEFAULT_STORAGE_DELETION_MAX_ATTEMPTS = 8;
const DEFAULT_STORAGE_DELETION_RETRY_BASE_MS = 30_000;
const DEFAULT_STORAGE_DELETION_RETRY_MAX_MS = 3_600_000;

/**
 * Any absolute HTTP(S) URL. A deployment-grade hostname is enforced separately,
 * where the environment says it is production; requiring one everywhere would
 * reject `http://localhost:3000` and make the application unrunnable locally.
 */
const ApplicationBaseUrlSchema = z
  .url()
  .refine(
    (value) => /^https?:\/\//.test(value),
    "APPLICATION_BASE_URL must use the http or https protocol.",
  );

const ProductionApplicationBaseUrlSchema = z.url({
  protocol: /^https$/,
  hostname: /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/,
});

function refineProductionPublicUrl(
  appEnvironment: AppEnvironment,
  key: "APPLICATION_BASE_URL" | "GOOGLE_REDIRECT_URI",
  value: string | undefined,
  context: z.RefinementCtx,
): void {
  if (appEnvironment !== AppEnvironment.Production || value === undefined) {
    return;
  }
  if (ProductionApplicationBaseUrlSchema.safeParse(value).success) return;

  context.addIssue({
    code: "custom",
    message: `${key} must be an https URL with a public hostname in production.`,
    path: [key],
  });
}

function refineProductionApplicationBaseUrl(
  value: { APP_ENV: AppEnvironment; APPLICATION_BASE_URL: string },
  context: z.RefinementCtx,
): void {
  refineProductionPublicUrl(
    value.APP_ENV,
    "APPLICATION_BASE_URL",
    value.APPLICATION_BASE_URL,
    context,
  );
}

/**
 * The local queue consumers stand in for deployed functions. Production runs
 * the deployed handlers only, so starting a local consumer there is refused.
 */
function refineLocalWorkerRuntime(
  value: { APP_ENV: AppEnvironment },
  context: z.RefinementCtx,
): void {
  if (getEnvironmentProfile(value.APP_ENV).workerRuntime === WorkerRuntime.Local) {
    return;
  }

  context.addIssue({
    code: "custom",
    message:
      "The local queue consumer cannot run in production; production workers are deployed functions.",
    path: ["APP_ENV"],
  });
}

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
    APP_ENV: AppEnvironmentSchema,
    DATABASE_URL: PostgresUrlSchema,
  })
  .strip()
  .superRefine(refineEnvironmentIsolation);

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

const CommandRateLimitWindowSchema = z.coerce
  .number()
  .int()
  .min(10)
  .max(3_600)
  .default(DEFAULT_COMMAND_RATE_LIMIT_WINDOW_SECONDS);

const CommandRateLimitMaximumSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(10_000);

/**
 * The one code the fake driver accepts. It is meaningful only in Local, the
 * sole environment whose profile allows that driver.
 */
const PhoneOtpDevelopmentCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/)
  .default("1234");

function refinePhoneOtpDriver(
  value: {
    APP_ENV: AppEnvironment;
    PHONE_OTP_DRIVER: z.infer<typeof PhoneOtpDriverSchema>;
  },
  context: z.RefinementCtx,
): void {
  refineDriverSelection(
    {
      appEnvironment: value.APP_ENV,
      variable: "PHONE_OTP_DRIVER",
      driver: value.PHONE_OTP_DRIVER,
      allowed: getEnvironmentProfile(value.APP_ENV).phoneOtpDriver.allowed,
    },
    context,
  );
}

function addMissingMsg91CredentialIssue(
  key: string,
  context: z.RefinementCtx,
): void {
  context.addIssue({
    code: "custom",
    message: `${key} is required when PHONE_OTP_DRIVER is msg91.`,
    path: [key],
  });
}

/**
 * Only what describes the browser widget. It deliberately excludes the session
 * secret, the database URL, and the server auth key: serving browser-safe
 * widget configuration must not depend on, or fail because of, credentials it
 * has no business reading.
 */
export const PhoneOtpWidgetEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema,
    PHONE_OTP_DRIVER: PhoneOtpDriverSchema,
    PHONE_OTP_DEV_CODE: PhoneOtpDevelopmentCodeSchema,
    MSG91_WIDGET_ID: z.string().trim().min(1).optional(),
    MSG91_WIDGET_TOKEN: z.string().trim().min(1).optional(),
  })
  .strip()
  .superRefine((value, context) => {
    refinePhoneOtpDriver(value, context);
    if (value.PHONE_OTP_DRIVER === "fake") return;

    for (const key of ["MSG91_WIDGET_ID", "MSG91_WIDGET_TOKEN"] as const) {
      if (!value[key]) addMissingMsg91CredentialIssue(key, context);
    }
  });

export const PhoneAuthEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema,
    DATABASE_URL: PostgresUrlSchema,
    SESSION_SECRET: z.string().min(32),
    PHONE_OTP_DRIVER: PhoneOtpDriverSchema,
    PHONE_OTP_DEV_CODE: PhoneOtpDevelopmentCodeSchema,
    MSG91_AUTH_KEY: z.string().trim().min(1).optional(),
    MSG91_WIDGET_ID: z.string().trim().min(1).optional(),
    MSG91_WIDGET_TOKEN: z.string().trim().min(1).optional(),
    MSG91_TIMEOUT_MS: z.coerce.number().int().min(500).max(15_000).default(5_000),
    PHONE_OTP_CHALLENGE_TTL_SECONDS: PhoneOtpChallengeTtlSchema,
    PHONE_OTP_RATE_LIMIT_WINDOW_SECONDS: PhoneOtpRateLimitWindowSchema,
    PHONE_OTP_SEND_MAX_PER_PHONE: PhoneOtpLimitSchema.max(10).default(3),
    PHONE_OTP_SEND_MAX_PER_IP: PhoneOtpLimitSchema.max(100).default(10),
    PHONE_OTP_VERIFY_MAX_PER_CHALLENGE: PhoneOtpLimitSchema.max(10).default(5),
    PHONE_OTP_VERIFY_MAX_PER_IP: PhoneOtpLimitSchema.max(300).default(30),
  })
  .strip()
  .superRefine((value, context) => {
    refineEnvironmentIsolation(value, context);
    /**
     * The fake driver accepts a fixed code and sends no message, so only the
     * Local profile allows it. Elsewhere a missing MSG91 setting is an error,
     * never a quiet fallback to it.
     */
    refinePhoneOtpDriver(value, context);
    if (value.PHONE_OTP_DRIVER === "fake") return;

    /**
     * The browser runs the widget, so it needs the widget identifier and its
     * public token. The auth key stays server-side: it is what makes access
     * token verification a server-to-server call.
     */
    const required = [
      "MSG91_AUTH_KEY",
      "MSG91_WIDGET_ID",
      "MSG91_WIDGET_TOKEN",
    ] as const;
    for (const key of required) {
      if (!value[key]) addMissingMsg91CredentialIssue(key, context);
    }
  });

/**
 * First-administrator bootstrap.
 *
 * This is not an authorization source. It names the one verified Google email
 * that may become the first administrator on a database that has never had one.
 * Once bootstrap completes, the database is authoritative and this value is
 * inert: removing it revokes nothing, and changing it transfers nothing.
 */
export const AdminBootstrapEnvironmentSchema = z
  .object({
    // Normalised before validation: `z.email()` checks the format first, so
    // trimming afterwards would reject an address with a stray space.
    BOOTSTRAP_ADMIN_EMAIL: emptyAsUnset(
      z.string().trim().toLowerCase().pipe(z.email()),
    ),
  })
  .strip();

/**
 * `fake` completes the ordinary OAuth challenge, identity, and session flow
 * with one fixed local identity instead of redirecting to Google. Only the
 * Local profile allows it; the client credentials are required whenever the
 * real driver is selected.
 */
export const GoogleAuthEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema,
    DATABASE_URL: PostgresUrlSchema,
    SESSION_SECRET: z.string().min(32),
    GOOGLE_AUTH_DRIVER: GoogleAuthDriverSchema,
    GOOGLE_CLIENT_ID: emptyAsUnset(z.string().trim().min(1)),
    GOOGLE_CLIENT_SECRET: emptyAsUnset(z.string().trim().min(1)),
    GOOGLE_REDIRECT_URI: z.url(),
    OAUTH_CHALLENGE_TTL_SECONDS: OAuthChallengeTtlSchema,
  })
  .strip()
  .superRefine((value, context) => {
    refineEnvironmentIsolation(value, context);
    refineDriverSelection(
      {
        appEnvironment: value.APP_ENV,
        variable: "GOOGLE_AUTH_DRIVER",
        driver: value.GOOGLE_AUTH_DRIVER,
        allowed: getEnvironmentProfile(value.APP_ENV).googleAuthDriver.allowed,
      },
      context,
    );
    refineProductionPublicUrl(
      value.APP_ENV,
      "GOOGLE_REDIRECT_URI",
      value.GOOGLE_REDIRECT_URI,
      context,
    );
    if (value.GOOGLE_AUTH_DRIVER === "fake") return;

    for (const key of ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] as const) {
      if (!value[key]) {
        context.addIssue({
          code: "custom",
          message: `${key} is required when GOOGLE_AUTH_DRIVER is google.`,
          path: [key],
        });
      }
    }
  });

const UploadConfigurationSchema = z.object({
  ...S3ConnectionSchema.shape,
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
  UPLOAD_PRESIGN_RATE_LIMIT_WINDOW_SECONDS: CommandRateLimitWindowSchema,
  UPLOAD_PRESIGN_MAX_PER_WINDOW: CommandRateLimitMaximumSchema.default(
    DEFAULT_UPLOAD_PRESIGN_MAX_PER_WINDOW,
  ),
});

export const UploadEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema,
    DATABASE_URL: PostgresUrlSchema,
    ...UploadConfigurationSchema.shape,
  })
  .strip()
  .superRefine((value, context) => {
    refineS3Connection(value, context);
    refineEnvironmentIsolation(value, context);
  });

export const EmailWorkerEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema,
    APPLICATION_BASE_URL: ApplicationBaseUrlSchema,
    DATABASE_URL: PostgresUrlSchema,
    EMAIL_DELIVERY_CLAIM_TTL_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(300_000)
      .default(DEFAULT_EMAIL_DELIVERY_CLAIM_TTL_MS),
    EMAIL_DRIVER: EmailDriverSchema,
    EMAIL_FROM: z.email(),
    MAILPIT_BASE_URL: ApplicationBaseUrlSchema.optional(),
    RESEND_API_KEY: z.string().trim().min(1).optional(),
    RESEND_TIMEOUT_MS: z.coerce.number().int().min(500).max(30_000).default(8_000),
  })
  .strip()
  .superRefine((value, context) => {
    refineEnvironmentIsolation(value, context);
    refineProductionApplicationBaseUrl(value, context);
    /**
     * The local inbox never forwards mail off this machine, which is exactly
     * why the production profile does not allow it.
     */
    refineDriverSelection(
      {
        appEnvironment: value.APP_ENV,
        variable: "EMAIL_DRIVER",
        driver: value.EMAIL_DRIVER,
        allowed: getEnvironmentProfile(value.APP_ENV).emailDriver.allowed,
      },
      context,
    );
    if (value.EMAIL_DRIVER === "mailpit") {
      if (!value.MAILPIT_BASE_URL) {
        context.addIssue({
          code: "custom",
          message: "MAILPIT_BASE_URL is required when EMAIL_DRIVER is mailpit.",
          path: ["MAILPIT_BASE_URL"],
        });
      }
      return;
    }

    if (!value.RESEND_API_KEY) {
      context.addIssue({
        code: "custom",
        message: "RESEND_API_KEY is required when EMAIL_DRIVER is resend.",
        path: ["RESEND_API_KEY"],
      });
    }
  });

export const EmailDispatchEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema,
    APPLICATION_BASE_URL: ApplicationBaseUrlSchema,
    ...SqsConnectionSchema.shape,
    DATABASE_URL: PostgresUrlSchema,
    EMAIL_DISPATCH_TOKEN: z.string().min(32),
    EMAIL_OUTBOX_BATCH_SIZE: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(DEFAULT_EMAIL_OUTBOX_BATCH_SIZE),
    EMAIL_OUTBOX_CLAIM_TTL_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(300_000)
      .default(DEFAULT_EMAIL_OUTBOX_CLAIM_TTL_MS),
    EMAIL_OUTBOX_RETRY_BASE_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(3_600_000)
      .default(DEFAULT_EMAIL_OUTBOX_RETRY_BASE_MS),
    EMAIL_OUTBOX_RETRY_MAX_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(3_600_000)
      .default(DEFAULT_EMAIL_OUTBOX_RETRY_MAX_MS),
    SQS_EMAIL_QUEUE_URL: z.url(),
  })
  .strip()
  .superRefine((value, context) => {
    refineSqsConnection(value, context);
    refineEnvironmentIsolation(value, context);
    refineProductionApplicationBaseUrl(value, context);
    if (value.EMAIL_OUTBOX_RETRY_MAX_MS < value.EMAIL_OUTBOX_RETRY_BASE_MS) {
      context.addIssue({
        code: "custom",
        message: "Email retry maximum must be at least the retry base.",
        path: ["EMAIL_OUTBOX_RETRY_MAX_MS"],
      });
    }
  });

export const LifecycleCleanupEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema,
    DATABASE_URL: PostgresUrlSchema,
    LIFECYCLE_CLEANUP_TOKEN: z.string().min(32),
    LIFECYCLE_CLEANUP_BATCH_SIZE: z.coerce
      .number()
      .int()
      .min(1)
      .max(1_000)
      .default(DEFAULT_LIFECYCLE_CLEANUP_BATCH_SIZE),
    SESSION_RETENTION_DAYS: z.coerce
      .number()
      .int()
      .min(1)
      .max(365)
      .default(DEFAULT_SESSION_RETENTION_DAYS),
    AUTH_CHALLENGE_RETENTION_DAYS: z.coerce
      .number()
      .int()
      .min(1)
      .max(90)
      .default(DEFAULT_AUTH_CHALLENGE_RETENTION_DAYS),
    COMMAND_RATE_LIMIT_RETENTION_HOURS: z.coerce
      .number()
      .int()
      .min(1)
      .max(168)
      .default(DEFAULT_COMMAND_RATE_LIMIT_RETENTION_HOURS),
  })
  .strip()
  .superRefine(refineEnvironmentIsolation);

export const StorageCleanupEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema,
    DATABASE_URL: PostgresUrlSchema,
    ...S3ConnectionSchema.shape,
    S3_BUCKET: z.string().trim().min(3).max(63),
    STORAGE_CLEANUP_TOKEN: z.string().min(32),
    STORAGE_CLEANUP_BATCH_SIZE: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(DEFAULT_STORAGE_CLEANUP_BATCH_SIZE),
    ABANDONED_UPLOAD_RETENTION_HOURS: z.coerce
      .number()
      .int()
      .min(1)
      .max(720)
      .default(DEFAULT_ABANDONED_UPLOAD_RETENTION_HOURS),
    STORAGE_DELETION_CLAIM_TTL_MS: z.coerce
      .number()
      .int()
      .min(10_000)
      .max(900_000)
      .default(DEFAULT_STORAGE_DELETION_CLAIM_TTL_MS),
    STORAGE_DELETION_MAX_ATTEMPTS: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(DEFAULT_STORAGE_DELETION_MAX_ATTEMPTS),
    STORAGE_DELETION_RETRY_BASE_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(3_600_000)
      .default(DEFAULT_STORAGE_DELETION_RETRY_BASE_MS),
    STORAGE_DELETION_RETRY_MAX_MS: z.coerce
      .number()
      .int()
      .min(1_000)
      .max(86_400_000)
      .default(DEFAULT_STORAGE_DELETION_RETRY_MAX_MS),
  })
  .strip()
  .superRefine((value, context) => {
    refineS3Connection(value, context);
    refineEnvironmentIsolation(value, context);
    if (
      value.STORAGE_DELETION_RETRY_MAX_MS < value.STORAGE_DELETION_RETRY_BASE_MS
    ) {
      context.addIssue({
        code: "custom",
        message: "Storage deletion retry maximum must be at least the retry base.",
        path: ["STORAGE_DELETION_RETRY_MAX_MS"],
      });
    }
  });

function refineBackgroundRemovalProvider(
  value: {
    APP_ENV: AppEnvironment;
    BACKGROUND_REMOVAL_PROVIDER: z.infer<typeof BackgroundRemovalProviderSchema>;
  },
  context: z.RefinementCtx,
): void {
  refineDriverSelection(
    {
      appEnvironment: value.APP_ENV,
      variable: "BACKGROUND_REMOVAL_PROVIDER",
      driver: value.BACKGROUND_REMOVAL_PROVIDER,
      allowed: getEnvironmentProfile(value.APP_ENV).backgroundRemovalProvider
        .allowed,
    },
    context,
  );
}

export const ProcessingEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema,
    DATABASE_URL: PostgresUrlSchema,
    ...SqsConnectionSchema.shape,
    SQS_IMAGE_QUEUE_URL: z.url(),
    BACKGROUND_REMOVAL_PROVIDER: BackgroundRemovalProviderSchema,
    PROCESSING_DISPATCH_TOKEN: z.string().min(32),
    PROCESSING_BATCH_RATE_LIMIT_WINDOW_SECONDS: CommandRateLimitWindowSchema,
    PROCESSING_BATCH_MAX_PER_WINDOW: CommandRateLimitMaximumSchema.default(
      DEFAULT_PROCESSING_BATCH_MAX_PER_WINDOW,
    ),
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
  .superRefine((value, context) => {
    refineSqsConnection(value, context);
    refineEnvironmentIsolation(value, context);
    refineBackgroundRemovalProvider(value, context);
    if (
      value.PROCESSING_OUTBOX_RETRY_MAX_MS <
      value.PROCESSING_OUTBOX_RETRY_BASE_MS
    ) {
      context.addIssue({
        code: "custom",
        message: "Processing retry maximum must be at least the retry base.",
        path: ["PROCESSING_OUTBOX_RETRY_MAX_MS"],
      });
    }
  });

/**
 * What a locally running worker needs to poll its own queue, and nothing more.
 * A worker must never hold a dispatch token: publishing is the application's
 * job, and consuming is the worker's.
 */
export const ImageWorkerQueueEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema,
    ...SqsConnectionSchema.shape,
    SQS_IMAGE_QUEUE_URL: z.url(),
  })
  .strip()
  .superRefine((value, context) => {
    refineLocalWorkerRuntime(value, context);
    refineSqsConnection(value, context);
    refineEnvironmentIsolation(value, context);
  });

export const EmailWorkerQueueEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema,
    ...SqsConnectionSchema.shape,
    SQS_EMAIL_QUEUE_URL: z.url(),
  })
  .strip()
  .superRefine((value, context) => {
    refineLocalWorkerRuntime(value, context);
    refineSqsConnection(value, context);
    refineEnvironmentIsolation(value, context);
  });

export const ImageWorkerEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema,
    DATABASE_URL: PostgresUrlSchema,
    ...S3ConnectionSchema.shape,
    S3_BUCKET: z.string().trim().min(3).max(63),
    BACKGROUND_REMOVAL_PROVIDER: BackgroundRemovalProviderSchema,
    REMOVEBG_API_KEY: emptyAsUnset(z.string().trim().min(1)),
    FAL_KEY: emptyAsUnset(z.string().trim().min(1)),
    SELF_HOSTED_BIREFNET_ENDPOINT: emptyAsUnset(z.url()),
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
    refineS3Connection(value, context);
    refineEnvironmentIsolation(value, context);
    refineBackgroundRemovalProvider(value, context);
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

export const ClientEnvironmentSchema = z
  .object({
    NODE_ENV: NodeEnvironmentSchema.default("development"),
    NEXT_PUBLIC_APP_URL: z.url(),
  })
  .strip();

export type ClientEnvironment = z.infer<typeof ClientEnvironmentSchema>;
export type GoogleAuthEnvironment = z.infer<typeof GoogleAuthEnvironmentSchema>;
export type AdminBootstrapEnvironment = z.infer<
  typeof AdminBootstrapEnvironmentSchema
>;
export type PhoneAuthEnvironment = z.infer<typeof PhoneAuthEnvironmentSchema>;
export type PhoneOtpWidgetEnvironment = z.infer<
  typeof PhoneOtpWidgetEnvironmentSchema
>;
export type SessionEnvironment = z.infer<typeof SessionEnvironmentSchema>;
export type UploadEnvironment = z.infer<typeof UploadEnvironmentSchema>;
export type ProcessingEnvironment = z.infer<
  typeof ProcessingEnvironmentSchema
>;
export type ImageWorkerEnvironment = z.infer<
  typeof ImageWorkerEnvironmentSchema
>;
export type ImageWorkerQueueEnvironment = z.infer<
  typeof ImageWorkerQueueEnvironmentSchema
>;
export type EmailWorkerQueueEnvironment = z.infer<
  typeof EmailWorkerQueueEnvironmentSchema
>;
export type EmailWorkerEnvironment = z.infer<
  typeof EmailWorkerEnvironmentSchema
>;
export type EmailDispatchEnvironment = z.infer<
  typeof EmailDispatchEnvironmentSchema
>;
export type LifecycleCleanupEnvironment = z.infer<
  typeof LifecycleCleanupEnvironmentSchema
>;
export type StorageCleanupEnvironment = z.infer<
  typeof StorageCleanupEnvironmentSchema
>;

export function parseClientEnvironment(
  environment: Record<string, string | undefined>,
): ClientEnvironment {
  return ClientEnvironmentSchema.parse(environment);
}

export function parseAdminBootstrapEnvironment(
  environment: Record<string, string | undefined>,
): AdminBootstrapEnvironment {
  return AdminBootstrapEnvironmentSchema.parse(environment);
}

export function parseGoogleAuthEnvironment(
  environment: Record<string, string | undefined>,
): GoogleAuthEnvironment {
  return GoogleAuthEnvironmentSchema.parse(applyEnvironmentProfile(environment));
}

export function parsePhoneOtpWidgetEnvironment(
  environment: Record<string, string | undefined>,
): PhoneOtpWidgetEnvironment {
  return PhoneOtpWidgetEnvironmentSchema.parse(applyEnvironmentProfile(environment));
}

export function parsePhoneAuthEnvironment(
  environment: Record<string, string | undefined>,
): PhoneAuthEnvironment {
  return PhoneAuthEnvironmentSchema.parse(applyEnvironmentProfile(environment));
}

export function parseSessionEnvironment(
  environment: Record<string, string | undefined>,
): SessionEnvironment {
  return SessionEnvironmentSchema.parse(applyEnvironmentProfile(environment));
}

export function parseUploadEnvironment(
  environment: Record<string, string | undefined>,
): UploadEnvironment {
  return UploadEnvironmentSchema.parse(applyEnvironmentProfile(environment));
}

export function parseProcessingEnvironment(
  environment: Record<string, string | undefined>,
): ProcessingEnvironment {
  return ProcessingEnvironmentSchema.parse(applyEnvironmentProfile(environment));
}

export function parseImageWorkerQueueEnvironment(
  environment: Record<string, string | undefined>,
): ImageWorkerQueueEnvironment {
  return ImageWorkerQueueEnvironmentSchema.parse(applyEnvironmentProfile(environment));
}

export function parseEmailWorkerQueueEnvironment(
  environment: Record<string, string | undefined>,
): EmailWorkerQueueEnvironment {
  return EmailWorkerQueueEnvironmentSchema.parse(applyEnvironmentProfile(environment));
}

export function parseImageWorkerEnvironment(
  environment: Record<string, string | undefined>,
): ImageWorkerEnvironment {
  return ImageWorkerEnvironmentSchema.parse(applyEnvironmentProfile(environment));
}

export function parseEmailWorkerEnvironment(
  environment: Record<string, string | undefined>,
): EmailWorkerEnvironment {
  return EmailWorkerEnvironmentSchema.parse(applyEnvironmentProfile(environment));
}

export function parseEmailDispatchEnvironment(
  environment: Record<string, string | undefined>,
): EmailDispatchEnvironment {
  return EmailDispatchEnvironmentSchema.parse(applyEnvironmentProfile(environment));
}

export function parseLifecycleCleanupEnvironment(
  environment: Record<string, string | undefined>,
): LifecycleCleanupEnvironment {
  return LifecycleCleanupEnvironmentSchema.parse(applyEnvironmentProfile(environment));
}

export function parseStorageCleanupEnvironment(
  environment: Record<string, string | undefined>,
): StorageCleanupEnvironment {
  return StorageCleanupEnvironmentSchema.parse(applyEnvironmentProfile(environment));
}
