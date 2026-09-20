import { describe, expect, it } from "vitest";

import {
  parseClientEnvironment,
  parseEmailDispatchEnvironment,
  parseEmailWorkerEnvironment,
  parseGoogleAuthEnvironment,
  parseImageWorkerEnvironment,
  parseLifecycleCleanupEnvironment,
  parsePhoneAuthEnvironment,
  parseProcessingEnvironment,
  parseSessionEnvironment,
  parseUploadEnvironment,
} from "../../../packages/config/src/environment";

const validEnvironment = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/studiocar_test",
  SESSION_SECRET: "a-secure-session-secret-at-least-32-characters",
  GOOGLE_CLIENT_ID: "google-client",
  GOOGLE_CLIENT_SECRET: "google-secret",
  GOOGLE_REDIRECT_URI: "http://localhost:3000/api/auth/google/callback",
  MSG91_AUTH_KEY: "msg91-key",
  MSG91_TEMPLATE_ID: "template-id",
  RESEND_API_KEY: "resend-key",
  EMAIL_FROM: "StudioCar <hello@studiocar.example>",
  APPLICATION_BASE_URL: "https://app.studiocar.example",
  AWS_REGION: "ap-south-1",
  S3_BUCKET: "studiocar-assets-test",
  SQS_IMAGE_QUEUE_URL: "https://sqs.ap-south-1.amazonaws.com/123/images",
  SQS_EMAIL_QUEUE_URL: "https://sqs.ap-south-1.amazonaws.com/123/email",
  BACKGROUND_REMOVAL_PROVIDER: "removebg",
  PROCESSING_DISPATCH_TOKEN: "processing-dispatch-token-at-least-32-characters",
  EMAIL_DISPATCH_TOKEN: "email-dispatch-token-at-least-32-characters",
  LIFECYCLE_CLEANUP_TOKEN: "lifecycle-cleanup-token-at-least-32-characters",
  REMOVEBG_API_KEY: "remove-bg-key",
} satisfies Record<string, string>;

describe("environment validation", () => {
  it.each([
    ["fal", "FAL_KEY"],
    ["birefnet", "SELF_HOSTED_BIREFNET_ENDPOINT"],
  ])("requires the configured %s provider credential", (provider, key) => {
    const result = (() => {
      try {
        parseImageWorkerEnvironment({
          ...validEnvironment,
          BACKGROUND_REMOVAL_PROVIDER: provider,
          REMOVEBG_API_KEY: undefined,
        });
        return undefined;
      } catch (error) {
        return error;
      }
    })();

    expect(result).toBeDefined();
    expect(String(result)).toContain(key);
  });

  it("exposes only explicitly public client values", () => {
    expect(
      parseClientEnvironment({
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://app.studiocar.example",
        SESSION_SECRET: "must-not-cross-the-client-boundary",
      }),
    ).toEqual({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://app.studiocar.example",
    });
  });

  it("validates the focused Google authentication runtime environment", () => {
    expect(parseGoogleAuthEnvironment(validEnvironment)).toEqual({
      NODE_ENV: "test",
      DATABASE_URL: validEnvironment.DATABASE_URL,
      SESSION_SECRET: validEnvironment.SESSION_SECRET,
      GOOGLE_CLIENT_ID: validEnvironment.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: validEnvironment.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: validEnvironment.GOOGLE_REDIRECT_URI,
      OAUTH_CHALLENGE_TTL_SECONDS: 600,
    });
  });

  it("validates bounded phone authentication defaults", () => {
    expect(parsePhoneAuthEnvironment(validEnvironment)).toEqual({
      NODE_ENV: "test",
      DATABASE_URL: validEnvironment.DATABASE_URL,
      SESSION_SECRET: validEnvironment.SESSION_SECRET,
      MSG91_AUTH_KEY: validEnvironment.MSG91_AUTH_KEY,
      MSG91_TEMPLATE_ID: validEnvironment.MSG91_TEMPLATE_ID,
      MSG91_TIMEOUT_MS: 5_000,
      PHONE_OTP_CHALLENGE_TTL_SECONDS: 600,
      PHONE_OTP_RATE_LIMIT_WINDOW_SECONDS: 600,
      PHONE_OTP_SEND_MAX_PER_PHONE: 3,
      PHONE_OTP_SEND_MAX_PER_IP: 10,
      PHONE_OTP_VERIFY_MAX_PER_CHALLENGE: 5,
      PHONE_OTP_VERIFY_MAX_PER_IP: 30,
    });
  });

  it("validates the focused session runtime without unrelated credentials", () => {
    expect(
      parseSessionEnvironment({ DATABASE_URL: validEnvironment.DATABASE_URL }),
    ).toEqual({ DATABASE_URL: validEnvironment.DATABASE_URL });
  });

  it("validates the focused upload runtime and bounded image limits", () => {
    expect(parseUploadEnvironment(validEnvironment)).toEqual({
      DATABASE_URL: validEnvironment.DATABASE_URL,
      AWS_REGION: validEnvironment.AWS_REGION,
      S3_BUCKET: validEnvironment.S3_BUCKET,
      MAX_UPLOAD_BYTES: 25 * 1024 * 1024,
      PRESIGNED_URL_TTL_SECONDS: 300,
      MAX_IMAGE_DIMENSION: 16_384,
      MAX_IMAGE_PIXELS: 100_000_000,
      UPLOAD_PRESIGN_RATE_LIMIT_WINDOW_SECONDS: 60,
      UPLOAD_PRESIGN_MAX_PER_WINDOW: 120,
    });
    expect(() =>
      parseUploadEnvironment({
        ...validEnvironment,
        MAX_IMAGE_DIMENSION: "70000",
      }),
    ).toThrow();
  });

  it("validates bounded processing dispatch settings", () => {
    expect(parseProcessingEnvironment(validEnvironment)).toEqual({
      DATABASE_URL: validEnvironment.DATABASE_URL,
      AWS_REGION: validEnvironment.AWS_REGION,
      SQS_IMAGE_QUEUE_URL: validEnvironment.SQS_IMAGE_QUEUE_URL,
      BACKGROUND_REMOVAL_PROVIDER: "removebg",
      PROCESSING_DISPATCH_TOKEN: validEnvironment.PROCESSING_DISPATCH_TOKEN,
      PROCESSING_BATCH_RATE_LIMIT_WINDOW_SECONDS: 60,
      PROCESSING_BATCH_MAX_PER_WINDOW: 20,
      PROCESSING_OUTBOX_BATCH_SIZE: 20,
      PROCESSING_OUTBOX_CLAIM_TTL_MS: 30_000,
      PROCESSING_OUTBOX_RETRY_BASE_MS: 1_000,
      PROCESSING_OUTBOX_RETRY_MAX_MS: 60_000,
    });
  });

  it("keeps provider and delivery secrets out of web control-plane parsers", () => {
    expect(parseProcessingEnvironment(validEnvironment)).not.toHaveProperty(
      "REMOVEBG_API_KEY",
    );
    expect(parseEmailDispatchEnvironment(validEnvironment)).not.toHaveProperty(
      "RESEND_API_KEY",
    );
    expect(parseUploadEnvironment(validEnvironment)).not.toHaveProperty(
      "SESSION_SECRET",
    );
  });

  it("validates bounded image worker settings and provider credentials", () => {
    expect(parseImageWorkerEnvironment(validEnvironment)).toEqual({
      DATABASE_URL: validEnvironment.DATABASE_URL,
      AWS_REGION: validEnvironment.AWS_REGION,
      S3_BUCKET: validEnvironment.S3_BUCKET,
      BACKGROUND_REMOVAL_PROVIDER: "removebg",
      REMOVEBG_API_KEY: validEnvironment.REMOVEBG_API_KEY,
      IMAGE_WORKER_CLAIM_TTL_MS: 120_000,
      PROCESSING_RETRY_BASE_MS: 5_000,
      PROCESSING_RETRY_MAX_MS: 300_000,
      REMOVEBG_TIMEOUT_MS: 60_000,
      MAX_PROVIDER_INPUT_BYTES: 22 * 1024 * 1024,
      MAX_PROVIDER_OUTPUT_BYTES: 100 * 1024 * 1024,
      MAX_WORKER_IMAGE_PIXELS: 50_000_000,
      PREVIEW_MAX_WIDTH: 720,
    });

    expect(() =>
      parseImageWorkerEnvironment({
        ...validEnvironment,
        PROCESSING_RETRY_BASE_MS: "5000",
        PROCESSING_RETRY_MAX_MS: "1000",
      }),
    ).toThrow();
  });

  it("validates the isolated email worker secrets and timeout", () => {
    expect(
      parseEmailWorkerEnvironment({
        APPLICATION_BASE_URL: validEnvironment.APPLICATION_BASE_URL,
        DATABASE_URL: validEnvironment.DATABASE_URL,
        EMAIL_FROM: "mail@studiocar.example",
        RESEND_API_KEY: "resend-secret",
      }),
    ).toEqual({
      APPLICATION_BASE_URL: validEnvironment.APPLICATION_BASE_URL,
      DATABASE_URL: validEnvironment.DATABASE_URL,
      EMAIL_DELIVERY_CLAIM_TTL_MS: 45_000,
      EMAIL_FROM: "mail@studiocar.example",
      RESEND_API_KEY: "resend-secret",
      RESEND_TIMEOUT_MS: 8_000,
    });

    expect(() => parseEmailWorkerEnvironment({})).toThrow();
  });

  it("validates bounded email outbox dispatch settings", () => {
    expect(parseEmailDispatchEnvironment(validEnvironment)).toEqual({
      APPLICATION_BASE_URL: validEnvironment.APPLICATION_BASE_URL,
      AWS_REGION: validEnvironment.AWS_REGION,
      DATABASE_URL: validEnvironment.DATABASE_URL,
      EMAIL_DISPATCH_TOKEN: validEnvironment.EMAIL_DISPATCH_TOKEN,
      EMAIL_OUTBOX_BATCH_SIZE: 20,
      EMAIL_OUTBOX_CLAIM_TTL_MS: 30_000,
      EMAIL_OUTBOX_RETRY_BASE_MS: 1_000,
      EMAIL_OUTBOX_RETRY_MAX_MS: 60_000,
      SQS_EMAIL_QUEUE_URL: validEnvironment.SQS_EMAIL_QUEUE_URL,
    });
  });

  it("validates focused lifecycle cleanup retention bounds", () => {
    expect(parseLifecycleCleanupEnvironment(validEnvironment)).toEqual({
      DATABASE_URL: validEnvironment.DATABASE_URL,
      LIFECYCLE_CLEANUP_TOKEN: validEnvironment.LIFECYCLE_CLEANUP_TOKEN,
      LIFECYCLE_CLEANUP_BATCH_SIZE: 100,
      SESSION_RETENTION_DAYS: 30,
      AUTH_CHALLENGE_RETENTION_DAYS: 7,
      COMMAND_RATE_LIMIT_RETENTION_HOURS: 24,
    });
    expect(() =>
      parseLifecycleCleanupEnvironment({
        ...validEnvironment,
        LIFECYCLE_CLEANUP_BATCH_SIZE: "1001",
      }),
    ).toThrow();
  });
});
