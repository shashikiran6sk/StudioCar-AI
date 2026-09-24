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
import { QueueTarget } from "./provider-drivers";

const QUEUE_URL_KEYS = ["SQS_IMAGE_QUEUE_URL", "SQS_EMAIL_QUEUE_URL"] as const;

type QueueUrlKey = (typeof QUEUE_URL_KEYS)[number];

function localQueueRequiredMessage(key: string): string {
  return `${key} must address local ElasticMQ in the local environment.`;
}

function queueTargetRefusedMessage(key: string, environment: string): string {
  return `${key} must be an AWS SQS queue in ${environment}; local ElasticMQ is refused.`;
}

function productionQueueInDevelopmentMessage(key: string): string {
  return `${key} names a production queue; Development must use its own.`;
}

function nonProductionQueueMessage(key: string): string {
  return `${key} declares a non-production environment and cannot be used in production.`;
}

const LOCAL_QUEUE_CREDENTIALS_MESSAGE =
  "SQS_ACCESS_KEY_ID must not be the local emulator key when using AWS SQS.";

function queueName(queueUrl: string): string {
  try {
    return new URL(queueUrl).pathname.split("/").filter(Boolean).at(-1) ?? "";
  } catch {
    return "";
  }
}

function allowedTargets(
  value: IsolationSubject,
  key: QueueUrlKey,
): readonly string[] {
  const profile = getEnvironmentProfile(value.APP_ENV);
  return key === "SQS_IMAGE_QUEUE_URL"
    ? profile.processingQueue.allowed
    : profile.emailQueue.allowed;
}

function refineQueueUrl(
  value: IsolationSubject,
  key: QueueUrlKey,
  addIssue: (message: string, path: string) => void,
): void {
  const queueUrl = value[key];
  if (queueUrl === undefined) return;

  const allowed = allowedTargets(value, key);
  const isLocal = isLocalServiceUrl(queueUrl);

  if (isLocal) {
    if (!allowed.includes(QueueTarget.LocalEmulator)) {
      addIssue(queueTargetRefusedMessage(key, value.APP_ENV), key);
    }
    return;
  }

  if (!allowed.includes(QueueTarget.AwsSqs) || !isAwsServiceUrl(queueUrl)) {
    addIssue(
      allowed.includes(QueueTarget.AwsSqs)
        ? queueTargetRefusedMessage(key, value.APP_ENV)
        : localQueueRequiredMessage(key),
      key,
    );
    return;
  }

  const name = queueName(queueUrl);
  if (
    value.APP_ENV === AppEnvironment.Development &&
    hasNameSegment(name, PRODUCTION_NAME_SEGMENTS)
  ) {
    addIssue(productionQueueInDevelopmentMessage(key), key);
  }
  if (
    value.APP_ENV === AppEnvironment.Production &&
    hasNameSegment(name, NON_PRODUCTION_NAME_SEGMENTS)
  ) {
    addIssue(nonProductionQueueMessage(key), key);
  }
}

/**
 * Local queues are ElasticMQ, Development queues default to ElasticMQ and may
 * move to AWS later, and production queues are AWS SQS only. Applies only to
 * runtimes that hold a queue.
 */
export function refineQueueIsolation(
  value: IsolationSubject,
  context: EnvironmentIssueSink,
): void {
  const addIssue = (message: string, path: string): void => {
    context.addIssue({ code: "custom", message, path: [path] });
  };

  for (const key of QUEUE_URL_KEYS) refineQueueUrl(value, key, addIssue);

  const endpoint = value.SQS_ENDPOINT;
  const usesAwsQueues = QUEUE_URL_KEYS.some((key) => {
    const queueUrl = value[key];
    return queueUrl !== undefined && !isLocalServiceUrl(queueUrl);
  });

  if (endpoint !== undefined && usesAwsQueues && !isAwsServiceUrl(endpoint)) {
    addIssue(queueTargetRefusedMessage("SQS_ENDPOINT", value.APP_ENV), "SQS_ENDPOINT");
  }
  if (
    usesAwsQueues &&
    value.SQS_ACCESS_KEY_ID === LOCAL_INFRASTRUCTURE.emulatorAccessKeyId
  ) {
    addIssue(LOCAL_QUEUE_CREDENTIALS_MESSAGE, "SQS_ACCESS_KEY_ID");
  }
}
