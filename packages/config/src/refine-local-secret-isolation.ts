import { AppEnvironment } from "./app-environment";
import type {
  EnvironmentIssueSink,
  IsolationSubject,
} from "./environment-isolation.types";
import { LOCAL_INFRASTRUCTURE } from "./local-infrastructure";

function committedSecretMessage(key: string, environment: string): string {
  return `${key} is the repository's committed local value and cannot be used in ${environment}.`;
}

/**
 * The committed Local session secret protects nothing once a database outlives
 * a laptop, so only Local accepts it. The committed command tokens are refused
 * in production, where the scheduler is a real, reachable service.
 */
const COMMAND_TOKENS = {
  PROCESSING_DISPATCH_TOKEN: LOCAL_INFRASTRUCTURE.processingDispatchToken,
  EMAIL_DISPATCH_TOKEN: LOCAL_INFRASTRUCTURE.emailDispatchToken,
  LIFECYCLE_CLEANUP_TOKEN: LOCAL_INFRASTRUCTURE.lifecycleCleanupToken,
  STORAGE_CLEANUP_TOKEN: LOCAL_INFRASTRUCTURE.storageCleanupToken,
} as const satisfies Partial<Record<keyof IsolationSubject, string>>;

const COMMAND_TOKEN_KEYS = [
  "PROCESSING_DISPATCH_TOKEN",
  "EMAIL_DISPATCH_TOKEN",
  "LIFECYCLE_CLEANUP_TOKEN",
  "STORAGE_CLEANUP_TOKEN",
] as const satisfies readonly (keyof typeof COMMAND_TOKENS)[];

export function refineLocalSecretIsolation(
  value: IsolationSubject,
  context: EnvironmentIssueSink,
): void {
  if (value.APP_ENV === AppEnvironment.Local) return;

  if (value.SESSION_SECRET === LOCAL_INFRASTRUCTURE.sessionSecret) {
    context.addIssue({
      code: "custom",
      message: committedSecretMessage("SESSION_SECRET", value.APP_ENV),
      path: ["SESSION_SECRET"],
    });
  }

  if (value.APP_ENV !== AppEnvironment.Production) return;

  for (const key of COMMAND_TOKEN_KEYS) {
    if (value[key] === COMMAND_TOKENS[key]) {
      context.addIssue({
        code: "custom",
        message: committedSecretMessage(key, value.APP_ENV),
        path: [key],
      });
    }
  }
}
