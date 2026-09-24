import { AppEnvironment } from "./app-environment";
import {
  getEnvironmentProfile,
  type EnvironmentProfile,
} from "./environment-profiles";
import { LOCAL_INFRASTRUCTURE } from "./local-infrastructure";
import { QueueTarget, StorageTarget } from "./provider-drivers";

type EnvironmentDefaults = Readonly<Record<string, string>>;

/**
 * Defaults that are applied together or not at all. When any of their settings
 * is configured explicitly, the configuration has chosen a different target
 * and none of the group's values may leak into it.
 */
export interface ProfileDefaultGroup {
  readonly values: EnvironmentDefaults;
  readonly allOrNothing: boolean;
}

const LOCAL_APPLICATION_DEFAULTS: EnvironmentDefaults = {
  APPLICATION_BASE_URL: LOCAL_INFRASTRUCTURE.applicationOrigin,
  GOOGLE_REDIRECT_URI: LOCAL_INFRASTRUCTURE.googleRedirectUri,
};

/**
 * Tokens for the internal maintenance commands. The scheduler that presents
 * them runs on the developer's machine in both Local and Development, and the
 * commands they authorise are idempotent, so a committed value is safe there.
 * Production refuses every one of them.
 */
const LOCAL_COMMAND_TOKEN_DEFAULTS: EnvironmentDefaults = {
  PROCESSING_DISPATCH_TOKEN: LOCAL_INFRASTRUCTURE.processingDispatchToken,
  EMAIL_DISPATCH_TOKEN: LOCAL_INFRASTRUCTURE.emailDispatchToken,
  LIFECYCLE_CLEANUP_TOKEN: LOCAL_INFRASTRUCTURE.lifecycleCleanupToken,
  STORAGE_CLEANUP_TOKEN: LOCAL_INFRASTRUCTURE.storageCleanupToken,
};

const LOCAL_MAIL_DEFAULTS: EnvironmentDefaults = {
  MAILPIT_BASE_URL: LOCAL_INFRASTRUCTURE.mailpitBaseUrl,
  EMAIL_FROM: LOCAL_INFRASTRUCTURE.emailFrom,
};

const LOCAL_DATABASE_DEFAULTS: EnvironmentDefaults = {
  DATABASE_URL: LOCAL_INFRASTRUCTURE.databaseUrl,
  SESSION_SECRET: LOCAL_INFRASTRUCTURE.sessionSecret,
};

const LOCAL_STORAGE_DEFAULTS: EnvironmentDefaults = {
  AWS_REGION: LOCAL_INFRASTRUCTURE.awsRegion,
  S3_BUCKET: LOCAL_INFRASTRUCTURE.storageBucket,
  S3_ENDPOINT: LOCAL_INFRASTRUCTURE.storageEndpoint,
  S3_FORCE_PATH_STYLE: "true",
  S3_ACCESS_KEY_ID: LOCAL_INFRASTRUCTURE.emulatorAccessKeyId,
  S3_SECRET_ACCESS_KEY: LOCAL_INFRASTRUCTURE.emulatorSecretAccessKey,
};

/**
 * ElasticMQ ignores the region, but the SQS client still needs one; a
 * Development settings file supplies its own for S3, which then wins.
 */
const LOCAL_REGION_DEFAULTS: EnvironmentDefaults = {
  AWS_REGION: LOCAL_INFRASTRUCTURE.awsRegion,
};

/**
 * All or nothing: a Development configuration that names AWS queues must not
 * inherit the ElasticMQ endpoint or emulator keys.
 */
const LOCAL_QUEUE_DEFAULTS: EnvironmentDefaults = {
  SQS_ENDPOINT: LOCAL_INFRASTRUCTURE.queueEndpoint,
  SQS_ACCESS_KEY_ID: LOCAL_INFRASTRUCTURE.emulatorAccessKeyId,
  SQS_SECRET_ACCESS_KEY: LOCAL_INFRASTRUCTURE.emulatorSecretAccessKey,
  SQS_IMAGE_QUEUE_URL: LOCAL_INFRASTRUCTURE.imageQueueUrl,
  SQS_EMAIL_QUEUE_URL: LOCAL_INFRASTRUCTURE.emailQueueUrl,
};

function driverDefaults(profile: EnvironmentProfile): EnvironmentDefaults {
  return {
    GOOGLE_AUTH_DRIVER: profile.googleAuthDriver.default,
    PHONE_OTP_DRIVER: profile.phoneOtpDriver.default,
    EMAIL_DRIVER: profile.emailDriver.default,
    BACKGROUND_REMOVAL_PROVIDER: profile.backgroundRemovalProvider.default,
  };
}

function individualDefaults(
  appEnvironment: AppEnvironment,
  profile: EnvironmentProfile,
): EnvironmentDefaults {
  return {
    ...driverDefaults(profile),
    ...(appEnvironment === AppEnvironment.Local ? LOCAL_DATABASE_DEFAULTS : {}),
    ...(profile.storage === StorageTarget.LocalEmulator
      ? LOCAL_STORAGE_DEFAULTS
      : {}),
    ...(queuesAreLocal(profile) ? LOCAL_REGION_DEFAULTS : {}),
    ...(profile.emailDriver.default === "mailpit" ? LOCAL_MAIL_DEFAULTS : {}),
    ...(appEnvironment === AppEnvironment.Production
      ? {}
      : { ...LOCAL_APPLICATION_DEFAULTS, ...LOCAL_COMMAND_TOKEN_DEFAULTS }),
  };
}

function queuesAreLocal(profile: EnvironmentProfile): boolean {
  return (
    profile.processingQueue.default === QueueTarget.LocalEmulator &&
    profile.emailQueue.default === QueueTarget.LocalEmulator
  );
}

/**
 * Every value an environment supplies when the settings file leaves it out.
 *
 * Only repository-owned infrastructure is ever defaulted. External credentials
 * (remove.bg, Google, MSG91, Resend, AWS), a Development session secret, and
 * anything a deployment owns have no default in any environment.
 */
export function getProfileDefaults(
  appEnvironment: AppEnvironment,
): readonly ProfileDefaultGroup[] {
  const profile = getEnvironmentProfile(appEnvironment);
  return [
    {
      values: individualDefaults(appEnvironment, profile),
      allOrNothing: false,
    },
    ...(queuesAreLocal(profile)
      ? [{ values: LOCAL_QUEUE_DEFAULTS, allOrNothing: true }]
      : []),
  ];
}
