import { AppEnvironment } from "./app-environment";
import {
  QueueTarget,
  StorageTarget,
  WorkerRuntime,
  type BackgroundRemovalProvider,
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
  readonly backgroundRemovalProvider: ProfileSelection<BackgroundRemovalProvider>;
  readonly storage: StorageTarget;
  readonly processingQueue: ProfileSelection<QueueTarget>;
  readonly workerRuntime: WorkerRuntime;
}

const EVERY_BACKGROUND_REMOVAL_PROVIDER: readonly BackgroundRemovalProvider[] = [
  "removebg",
  "fal",
  "birefnet",
];

/**
 * The single source of truth for what each environment runs.
 *
 * - Local needs nothing but a remove.bg key: fake sign-in, MinIO, ElasticMQ,
 *   and a locally running image worker.
 * - Development exercises the real external boundaries (Google, MSG91, AWS S3,
 *   AWS SQS, remove.bg) while the image worker and the dispatcher stay local
 *   and easy to debug.
 * - Production is fully deployed and tolerates no local adapter at all.
 */
export const ENVIRONMENT_PROFILES = {
  [AppEnvironment.Local]: {
    googleAuthDriver: { default: "fake", allowed: ["fake", "google"] },
    phoneOtpDriver: { default: "fake", allowed: ["fake", "msg91"] },
    backgroundRemovalProvider: {
      default: "removebg",
      allowed: EVERY_BACKGROUND_REMOVAL_PROVIDER,
    },
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
    backgroundRemovalProvider: {
      default: "removebg",
      allowed: EVERY_BACKGROUND_REMOVAL_PROVIDER,
    },
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
    backgroundRemovalProvider: {
      default: "removebg",
      allowed: EVERY_BACKGROUND_REMOVAL_PROVIDER,
    },
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
