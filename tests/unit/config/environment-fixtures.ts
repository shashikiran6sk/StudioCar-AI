import type {
  EnvironmentIssueSink,
  IsolationSubject,
} from "../../../packages/config/src/environment-isolation.types";
import {
  parseAdminBootstrapEnvironment,
  parseGoogleAuthEnvironment,
  parseImageWorkerEnvironment,
  parseImageWorkerQueueEnvironment,
  parseLifecycleCleanupEnvironment,
  parsePhoneAuthEnvironment,
  parsePhoneOtpWidgetEnvironment,
  parseProcessingEnvironment,
  parseSessionEnvironment,
  parseStorageCleanupEnvironment,
  parseUploadEnvironment,
} from "../../../packages/config/src/environment";

export type EnvironmentValues = Record<string, string | undefined>;
type Parser = (environment: EnvironmentValues) => unknown;

/** Every parser the Next.js application runs. */
export const APPLICATION_PARSERS: readonly [string, Parser][] = [
  ["session", parseSessionEnvironment],
  ["google auth", parseGoogleAuthEnvironment],
  ["phone auth", parsePhoneAuthEnvironment],
  ["phone widget", parsePhoneOtpWidgetEnvironment],
  ["admin bootstrap", parseAdminBootstrapEnvironment],
  ["upload", parseUploadEnvironment],
  ["processing", parseProcessingEnvironment],
  ["lifecycle cleanup", parseLifecycleCleanupEnvironment],
  ["storage cleanup", parseStorageCleanupEnvironment],
];

/** The worker core, deployed in production and run locally elsewhere. */
export const WORKER_PARSERS: readonly [string, Parser][] = [
  ["image worker", parseImageWorkerEnvironment],
];

/** The long-polling consumer that stands in for the deployed event source. */
export const LOCAL_CONSUMER_PARSERS: readonly [string, Parser][] = [
  ["image queue consumer", parseImageWorkerQueueEnvironment],
];

/** Everything a Local developer writes down: the environment and one key. */
export const LOCAL_ENVIRONMENT = {
  APP_ENV: "local",
  REMOVEBG_API_KEY: "remove-bg-key",
} satisfies EnvironmentValues;

/** A complete Development configuration with placeholder credentials. */
export const DEVELOPMENT_ENVIRONMENT = {
  APP_ENV: "development",
  DATABASE_URL:
    "postgresql://studiocar:secret@dev-db.studiocar.example:5432/studiocar_dev",
  SESSION_SECRET: "development-session-secret-of-at-least-32-characters",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  GOOGLE_REDIRECT_URI: "http://localhost:3000/api/auth/google/callback",
  MSG91_WIDGET_ID: "msg91-widget-id",
  MSG91_WIDGET_TOKEN: "msg91-widget-token",
  MSG91_AUTH_KEY: "msg91-auth-key",
  AWS_REGION: "ap-south-1",
  S3_BUCKET: "studiocar-dev-images",
  SQS_IMAGE_QUEUE_URL:
    "https://sqs.ap-south-1.amazonaws.com/123456789012/studiocar-dev-image-processing",
  REMOVEBG_API_KEY: "remove-bg-key",
} satisfies EnvironmentValues;

/** A complete production configuration with placeholder credentials. */
export const PRODUCTION_ENVIRONMENT = {
  APP_ENV: "production",
  DATABASE_URL:
    "postgresql://studiocar:secret@db.studiocar.example:5432/studiocar",
  SESSION_SECRET: "production-session-secret-of-at-least-32-characters",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  GOOGLE_REDIRECT_URI: "https://app.studiocar.example/api/auth/google/callback",
  MSG91_WIDGET_ID: "msg91-widget-id",
  MSG91_WIDGET_TOKEN: "msg91-widget-token",
  MSG91_AUTH_KEY: "msg91-auth-key",
  AWS_REGION: "ap-south-1",
  S3_BUCKET: "studiocar-prod-images",
  SQS_IMAGE_QUEUE_URL:
    "https://sqs.ap-south-1.amazonaws.com/123456789012/studiocar-image-processing",
  REMOVEBG_API_KEY: "remove-bg-key",
  PROCESSING_DISPATCH_TOKEN: "production-processing-dispatch-token-000000",
  LIFECYCLE_CLEANUP_TOKEN: "production-lifecycle-cleanup-token-000000",
  STORAGE_CLEANUP_TOKEN: "production-storage-cleanup-token-00000000",
} satisfies EnvironmentValues;

/** The error a parser throws, as text, or undefined when it parses. */
export function parseError(parser: Parser, environment: EnvironmentValues): string | undefined {
  try {
    parser(environment);
    return undefined;
  } catch (error) {
    return String(error);
  }
}

/** The messages a refinement reports for one subject. */
export function refinementIssues(
  refine: (value: IsolationSubject, context: EnvironmentIssueSink) => void,
  value: IsolationSubject,
): string[] {
  const messages: string[] = [];
  refine(value, {
    addIssue: (issue) => {
      messages.push(issue.message);
    },
  });
  return messages;
}
