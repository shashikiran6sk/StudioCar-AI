import { AppEnvironment } from "./app-environment";
import {
  QueueTarget,
  StorageTarget,
  WorkerRuntime,
  type GoogleAuthDriver,
  type PhoneOtpDriver,
} from "./provider-drivers";

/**
 * A selection an environment makes by default, and the explicit overrides it
 * tolerates. An override outside `allowed` is a configuration error, never a
 * silent fallback.
 */
export interface ProfileSelection<T extends string> {
  readonly default: T;
  readonly allowed: readonly T[];
}

export interface EnvironmentProfile {
  readonly googleAuthDriver: ProfileSelection<GoogleAuthDriver>;
  readonly phoneOtpDriver: ProfileSelection<PhoneOtpDriver>;
  readonly storage: StorageTarget;
  readonly processingQueue: ProfileSelection<QueueTarget>;
  readonly workerRuntime: WorkerRuntime;
}

/**
 * The single source of truth for what each environment runs.
 *
 * - Local runs fake sign-in, MinIO, ElasticMQ and a locally running image
 *   worker. Leonardo cannot fetch a MinIO URL, so completing a real
 *   background removal needs the Development profile's AWS storage.
 * - Development exercises the real external boundaries (Google, MSG91, AWS S3,
 *   AWS SQS, Leonardo) while the image worker and the dispatcher stay local
 *   and easy to debug.
 * - Production is fully deployed and tolerates no local adapter at all.
 */
export const ENVIRONMENT_PROFILES = {
  [AppEnvironment.Local]: {
    googleAuthDriver: { default: "fake", allowed: ["fake", "google"] },
    phoneOtpDriver: { default: "fake", allowed: ["fake", "msg91"] },
    storage: StorageTarget.LocalEmulator,
    processingQueue: {
      default: QueueTarget.LocalEmulator,
      allowed: [QueueTarget.LocalEmulator],
    },
    workerRuntime: WorkerRuntime.Local,
  },
  [AppEnvironment.Development]: {
    googleAuthDriver: { default: "google", allowed: ["google"] },
    phoneOtpDriver: { default: "msg91", allowed: ["msg91"] },
    storage: StorageTarget.AwsS3,
    processingQueue: {
      default: QueueTarget.AwsSqs,
      allowed: [QueueTarget.AwsSqs],
    },
    workerRuntime: WorkerRuntime.Local,
  },
  [AppEnvironment.Production]: {
    googleAuthDriver: { default: "google", allowed: ["google"] },
    phoneOtpDriver: { default: "msg91", allowed: ["msg91"] },
    storage: StorageTarget.AwsS3,
    processingQueue: {
      default: QueueTarget.AwsSqs,
      allowed: [QueueTarget.AwsSqs],
    },
    workerRuntime: WorkerRuntime.Deployed,
  },
} as const satisfies Record<AppEnvironment, EnvironmentProfile>;

export function getEnvironmentProfile(
  appEnvironment: AppEnvironment,
): EnvironmentProfile {
  return ENVIRONMENT_PROFILES[appEnvironment];
}
