import { z } from "zod";

/**
 * Concrete implementations a composition root can select. Product code never
 * sees these names; it depends on ports, and the environment profile decides
 * which adapter stands behind each one.
 */
export const GoogleAuthDriverSchema = z.enum(["google", "fake"]);
export const PhoneOtpDriverSchema = z.enum(["msg91", "fake"]);
export const BackgroundRemovalProviderSchema = z.enum([
  "removebg",
  "fal",
  "birefnet",
]);

/** Where object storage lives: the local S3-compatible emulator, or AWS S3. */
export const StorageTarget = {
  LocalEmulator: "local-emulator",
  AwsS3: "aws-s3",
} as const;

/** Where a queue lives: the local SQS-compatible emulator, or AWS SQS. */
export const QueueTarget = {
  LocalEmulator: "local-emulator",
  AwsSqs: "aws-sqs",
} as const;

/** How workers run: long-polling local consumers, or deployed functions. */
export const WorkerRuntime = {
  Local: "local",
  Deployed: "deployed",
} as const;

export type GoogleAuthDriver = z.infer<typeof GoogleAuthDriverSchema>;
export type PhoneOtpDriver = z.infer<typeof PhoneOtpDriverSchema>;
export type BackgroundRemovalProvider = z.infer<
  typeof BackgroundRemovalProviderSchema
>;
export type StorageTarget = (typeof StorageTarget)[keyof typeof StorageTarget];
export type QueueTarget = (typeof QueueTarget)[keyof typeof QueueTarget];
export type WorkerRuntime = (typeof WorkerRuntime)[keyof typeof WorkerRuntime];
