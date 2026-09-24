import type { AppEnvironment } from "./app-environment";

/**
 * The settings environment isolation inspects. Each runtime schema carries only
 * the subset it owns, so every field but `APP_ENV` is optional and a rule
 * applies only where its setting is present.
 */
export interface IsolationSubject {
  APP_ENV: AppEnvironment;
  DATABASE_URL?: string;
  SESSION_SECRET?: string;
  S3_BUCKET?: string;
  S3_ENDPOINT?: string | undefined;
  S3_ACCESS_KEY_ID?: string | undefined;
  SQS_ENDPOINT?: string | undefined;
  SQS_ACCESS_KEY_ID?: string | undefined;
  SQS_IMAGE_QUEUE_URL?: string;
  PROCESSING_DISPATCH_TOKEN?: string;
  LIFECYCLE_CLEANUP_TOKEN?: string;
  STORAGE_CLEANUP_TOKEN?: string;
}

/**
 * One configuration problem, located at the setting that causes it. A type
 * alias rather than an interface, so it is assignable to Zod's open issue type.
 */
export type EnvironmentIssue = {
  code: "custom";
  message: string;
  path: string[];
};

/**
 * Where a rule reports problems. A Zod refinement context satisfies it, and so
 * does a plain collector, which keeps the rules independent of the validator.
 */
export interface EnvironmentIssueSink {
  addIssue(issue: EnvironmentIssue): void;
}
