import { describe, expect, it } from "vitest";

import {
  parseClientEnvironment,
  parseGoogleAuthEnvironment,
  parsePhoneAuthEnvironment,
  parseProcessingEnvironment,
  parseSessionEnvironment,
  parseServerEnvironment,
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
  AWS_REGION: "ap-south-1",
  S3_BUCKET: "studiocar-assets-test",
  SQS_IMAGE_QUEUE_URL: "https://sqs.ap-south-1.amazonaws.com/123/images",
  SQS_EMAIL_QUEUE_URL: "https://sqs.ap-south-1.amazonaws.com/123/email",
  BACKGROUND_REMOVAL_PROVIDER: "removebg",
  PROCESSING_DISPATCH_TOKEN: "processing-dispatch-token-at-least-32-characters",
  REMOVEBG_API_KEY: "remove-bg-key",
} satisfies Record<string, string>;

describe("environment validation", () => {
  it("coerces bounded operational defaults", () => {
    expect(parseServerEnvironment(validEnvironment)).toMatchObject({
      MAX_UPLOAD_BYTES: 25 * 1024 * 1024,
      PRESIGNED_URL_TTL_SECONDS: 300,
      MAX_IMAGE_DIMENSION: 16_384,
      MAX_IMAGE_PIXELS: 100_000_000,
      BACKGROUND_REMOVAL_PROVIDER: "removebg",
    });
  });

  it.each([
    ["fal", "FAL_KEY"],
    ["birefnet", "SELF_HOSTED_BIREFNET_ENDPOINT"],
  ])("requires the configured %s provider credential", (provider, key) => {
    const result = (() => {
      try {
        parseServerEnvironment({
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
      PROCESSING_OUTBOX_BATCH_SIZE: 20,
      PROCESSING_OUTBOX_CLAIM_TTL_MS: 30_000,
      PROCESSING_OUTBOX_RETRY_BASE_MS: 1_000,
      PROCESSING_OUTBOX_RETRY_MAX_MS: 60_000,
    });
  });
});
