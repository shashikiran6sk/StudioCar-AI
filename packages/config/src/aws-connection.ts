import { z } from "zod";

/**
 * Environment flags arrive as strings. Absent means disabled rather than
 * invalid, so every runtime resolves a concrete boolean.
 */
const BooleanFlagSchema = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((value) => value === "true" || value === "1");

const AccessKeyIdSchema = z.string().trim().min(1).optional();
const SecretAccessKeySchema = z.string().trim().min(1).optional();

export const S3ConnectionSchema = z.object({
  AWS_REGION: z.string().trim().min(1),
  S3_ENDPOINT: z.url().optional(),
  S3_FORCE_PATH_STYLE: BooleanFlagSchema,
  S3_ACCESS_KEY_ID: AccessKeyIdSchema,
  S3_SECRET_ACCESS_KEY: SecretAccessKeySchema,
});

export const SqsConnectionSchema = z.object({
  AWS_REGION: z.string().trim().min(1),
  SQS_ENDPOINT: z.url().optional(),
  SQS_ACCESS_KEY_ID: AccessKeyIdSchema,
  SQS_SECRET_ACCESS_KEY: SecretAccessKeySchema,
});

export type S3Connection = z.infer<typeof S3ConnectionSchema>;
export type SqsConnection = z.infer<typeof SqsConnectionSchema>;

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface S3ClientOptions {
  region: string;
  forcePathStyle: boolean;
  endpoint?: string;
  credentials?: AwsCredentials;
}

export interface SqsClientOptions {
  region: string;
  endpoint?: string;
  credentials?: AwsCredentials;
}

const PARTIAL_S3_CREDENTIALS_MESSAGE =
  "S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be configured together, or both omitted to use the deployment's workload identity.";
const PARTIAL_SQS_CREDENTIALS_MESSAGE =
  "SQS_ACCESS_KEY_ID and SQS_SECRET_ACCESS_KEY must be configured together, or both omitted to use the deployment's workload identity.";

function credentialsAreConsistent(
  accessKeyId: string | undefined,
  secretAccessKey: string | undefined,
): boolean {
  return Boolean(accessKeyId) === Boolean(secretAccessKey);
}

/**
 * Half-configured credentials fail closed at parse time. Resolving them lazily
 * inside an AWS client turns a deployment mistake into an opaque runtime
 * outage at the first signed request.
 */
export function refineS3Connection(
  value: S3Connection,
  context: z.RefinementCtx,
): void {
  if (
    !credentialsAreConsistent(value.S3_ACCESS_KEY_ID, value.S3_SECRET_ACCESS_KEY)
  ) {
    context.addIssue({
      code: "custom",
      message: PARTIAL_S3_CREDENTIALS_MESSAGE,
      path: ["S3_SECRET_ACCESS_KEY"],
    });
  }
}

export function refineSqsConnection(
  value: SqsConnection,
  context: z.RefinementCtx,
): void {
  if (
    !credentialsAreConsistent(
      value.SQS_ACCESS_KEY_ID,
      value.SQS_SECRET_ACCESS_KEY,
    )
  ) {
    context.addIssue({
      code: "custom",
      message: PARTIAL_SQS_CREDENTIALS_MESSAGE,
      path: ["SQS_SECRET_ACCESS_KEY"],
    });
  }
}

/**
 * Omitting `credentials` keeps the AWS default provider chain, which is how
 * production resolves a workload identity. Explicit keys exist for local
 * emulators and for deployments without an attachable role.
 */
export function createS3ClientOptions(
  connection: S3Connection,
): S3ClientOptions {
  const accessKeyId = connection.S3_ACCESS_KEY_ID;
  const secretAccessKey = connection.S3_SECRET_ACCESS_KEY;

  return {
    region: connection.AWS_REGION,
    forcePathStyle: connection.S3_FORCE_PATH_STYLE,
    ...(connection.S3_ENDPOINT === undefined
      ? {}
      : { endpoint: connection.S3_ENDPOINT }),
    ...(accessKeyId === undefined || secretAccessKey === undefined
      ? {}
      : { credentials: { accessKeyId, secretAccessKey } }),
  };
}

export function createSqsClientOptions(
  connection: SqsConnection,
): SqsClientOptions {
  const accessKeyId = connection.SQS_ACCESS_KEY_ID;
  const secretAccessKey = connection.SQS_SECRET_ACCESS_KEY;

  return {
    region: connection.AWS_REGION,
    ...(connection.SQS_ENDPOINT === undefined
      ? {}
      : { endpoint: connection.SQS_ENDPOINT }),
    ...(accessKeyId === undefined || secretAccessKey === undefined
      ? {}
      : { credentials: { accessKeyId, secretAccessKey } }),
  };
}
