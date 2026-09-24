import { AppEnvironment } from "./app-environment";
import {
  NON_PRODUCTION_NAME_SEGMENTS,
  PRODUCTION_NAME_SEGMENTS,
} from "./environment-isolation.constants";
import type {
  EnvironmentIssueSink,
  IsolationSubject,
} from "./environment-isolation.types";
import { getEnvironmentProfile } from "./environment-profiles";
import { hasNameSegment } from "./has-name-segment";
import { isAwsServiceUrl } from "./is-aws-service-url";
import { isLocalServiceUrl } from "./is-local-service-url";
import { LOCAL_INFRASTRUCTURE } from "./local-infrastructure";
import { StorageTarget } from "./provider-drivers";

const LOCAL_STORAGE_REQUIRED_MESSAGE =
  "S3_ENDPOINT must address local MinIO in the local environment.";
const AWS_STORAGE_REQUIRED_MESSAGE =
  "S3_ENDPOINT must be unset or an AWS S3 address outside the local environment; local MinIO is refused.";
const LOCAL_STORAGE_CREDENTIALS_MESSAGE =
  "S3_ACCESS_KEY_ID must not be the local emulator key outside the local environment.";
const LOCAL_BUCKET_MESSAGE =
  "S3_BUCKET must not be the local bucket outside the local environment.";
const PRODUCTION_BUCKET_IN_DEVELOPMENT_MESSAGE =
  "S3_BUCKET names a production bucket; Development must use its own Development bucket.";
const PRODUCTION_BUCKET_UNMARKED_MESSAGE =
  "S3_BUCKET must declare production ownership with a prod or production name segment.";
const NON_PRODUCTION_BUCKET_MESSAGE =
  "S3_BUCKET declares a non-production environment and cannot be used in production.";

function refineEndpoint(
  value: IsolationSubject,
  addIssue: (message: string, path: string) => void,
): void {
  const endpoint = value.S3_ENDPOINT;
  const target = getEnvironmentProfile(value.APP_ENV).storage;

  if (target === StorageTarget.LocalEmulator) {
    if (endpoint === undefined || !isLocalServiceUrl(endpoint)) {
      addIssue(LOCAL_STORAGE_REQUIRED_MESSAGE, "S3_ENDPOINT");
    }
    return;
  }

  if (endpoint !== undefined && !isAwsServiceUrl(endpoint)) {
    addIssue(AWS_STORAGE_REQUIRED_MESSAGE, "S3_ENDPOINT");
  }
  if (value.S3_ACCESS_KEY_ID === LOCAL_INFRASTRUCTURE.emulatorAccessKeyId) {
    addIssue(LOCAL_STORAGE_CREDENTIALS_MESSAGE, "S3_ACCESS_KEY_ID");
  }
}

function refineBucket(
  value: IsolationSubject,
  addIssue: (message: string, path: string) => void,
): void {
  const bucket = value.S3_BUCKET;
  if (bucket === undefined || value.APP_ENV === AppEnvironment.Local) return;

  if (bucket === LOCAL_INFRASTRUCTURE.storageBucket) {
    addIssue(LOCAL_BUCKET_MESSAGE, "S3_BUCKET");
    return;
  }

  if (value.APP_ENV === AppEnvironment.Development) {
    if (hasNameSegment(bucket, PRODUCTION_NAME_SEGMENTS)) {
      addIssue(PRODUCTION_BUCKET_IN_DEVELOPMENT_MESSAGE, "S3_BUCKET");
    }
    return;
  }

  if (!hasNameSegment(bucket, PRODUCTION_NAME_SEGMENTS)) {
    addIssue(PRODUCTION_BUCKET_UNMARKED_MESSAGE, "S3_BUCKET");
  }
  if (hasNameSegment(bucket, NON_PRODUCTION_NAME_SEGMENTS)) {
    addIssue(NON_PRODUCTION_BUCKET_MESSAGE, "S3_BUCKET");
  }
}

/**
 * Local targets only MinIO, Development only its own AWS bucket, and
 * production only a bucket that declares production ownership. Applies only to
 * runtimes that hold storage settings.
 */
export function refineStorageIsolation(
  value: IsolationSubject,
  context: EnvironmentIssueSink,
): void {
  if (value.S3_BUCKET === undefined) return;

  const addIssue = (message: string, path: string): void => {
    context.addIssue({ code: "custom", message, path: [path] });
  };
  refineEndpoint(value, addIssue);
  refineBucket(value, addIssue);
}
