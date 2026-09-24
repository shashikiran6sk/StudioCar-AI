import { describe, expect, it } from "vitest";

import {
  parseAdminBootstrapEnvironment,
  parseClientEnvironment,
  parseGoogleAuthEnvironment,
  parseImageWorkerEnvironment,
  parseLifecycleCleanupEnvironment,
  parsePhoneAuthEnvironment,
  parseProcessingEnvironment,
  parseSessionEnvironment,
  parseStorageCleanupEnvironment,
  parseUploadEnvironment,
} from "../../../packages/config/src/environment";

// A Development configuration that has moved its queues to AWS SQS, so every
// explicit value below is also what the parsers return.
const validEnvironment = {
  APP_ENV: "development",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/studiocar_test",
  SESSION_SECRET: "a-secure-session-secret-at-least-32-characters",
  GOOGLE_CLIENT_ID: "google-client",
  GOOGLE_CLIENT_SECRET: "google-secret",
  GOOGLE_REDIRECT_URI: "http://localhost:3000/api/auth/google/callback",
  PHONE_OTP_DRIVER: "msg91",
  MSG91_AUTH_KEY: "msg91-key",
  MSG91_WIDGET_ID: "msg91-widget",
  MSG91_WIDGET_TOKEN: "msg91-widget-token",
  AWS_REGION: "ap-south-1",
  S3_BUCKET: "studiocar-assets-test",
  SQS_IMAGE_QUEUE_URL: "https://sqs.ap-south-1.amazonaws.com/123/images",
  BACKGROUND_REMOVAL_PROVIDER: "removebg",
  PROCESSING_DISPATCH_TOKEN: "processing-dispatch-token-at-least-32-characters",
  LIFECYCLE_CLEANUP_TOKEN: "lifecycle-cleanup-token-at-least-32-characters",
  STORAGE_CLEANUP_TOKEN: "storage-cleanup-token-at-least-32-characters",
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
      APP_ENV: "development",
      DATABASE_URL: validEnvironment.DATABASE_URL,
      SESSION_SECRET: validEnvironment.SESSION_SECRET,
      GOOGLE_AUTH_DRIVER: "google",
      GOOGLE_CLIENT_ID: validEnvironment.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: validEnvironment.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: validEnvironment.GOOGLE_REDIRECT_URI,
      OAUTH_CHALLENGE_TTL_SECONDS: 600,
    });
  });

  it("validates bounded phone authentication defaults", () => {
    expect(parsePhoneAuthEnvironment(validEnvironment)).toEqual({
      APP_ENV: "development",
      DATABASE_URL: validEnvironment.DATABASE_URL,
      SESSION_SECRET: validEnvironment.SESSION_SECRET,
      PHONE_OTP_DRIVER: "msg91",
      PHONE_OTP_DEV_CODE: "1234",
      MSG91_AUTH_KEY: validEnvironment.MSG91_AUTH_KEY,
      MSG91_WIDGET_ID: validEnvironment.MSG91_WIDGET_ID,
      MSG91_WIDGET_TOKEN: validEnvironment.MSG91_WIDGET_TOKEN,
      MSG91_TIMEOUT_MS: 5_000,
      PHONE_OTP_CHALLENGE_TTL_SECONDS: 600,
      PHONE_OTP_RATE_LIMIT_WINDOW_SECONDS: 600,
      PHONE_OTP_SEND_MAX_PER_PHONE: 3,
      PHONE_OTP_SEND_MAX_PER_IP: 10,
      PHONE_OTP_VERIFY_MAX_PER_CHALLENGE: 5,
      PHONE_OTP_VERIFY_MAX_PER_IP: 30,
    });
  });

  it("never requires a DLT template identifier for the widget flow", () => {
    expect(
      Object.keys(parsePhoneAuthEnvironment(validEnvironment)),
    ).not.toContain("MSG91_TEMPLATE_ID");
  });

  it("requires every widget credential when the msg91 driver is selected", () => {
    for (const key of [
      "MSG91_AUTH_KEY",
      "MSG91_WIDGET_ID",
      "MSG91_WIDGET_TOKEN",
    ]) {
      const incomplete = { ...validEnvironment, [key]: undefined };
      expect(() => parsePhoneAuthEnvironment(incomplete)).toThrow();
    }
  });

  it("selects the fake driver only in the local environment", () => {
    expect(parsePhoneAuthEnvironment({ APP_ENV: "local" }).PHONE_OTP_DRIVER).toBe(
      "fake",
    );

    // Development never falls back to the fake driver: missing MSG91
    // credentials are an error, and so is asking for the fake driver.
    expect(() =>
      parsePhoneAuthEnvironment({
        APP_ENV: "development",
        DATABASE_URL: validEnvironment.DATABASE_URL,
        SESSION_SECRET: validEnvironment.SESSION_SECRET,
      }),
    ).toThrow(/MSG91_AUTH_KEY is required/);
    expect(() =>
      parsePhoneAuthEnvironment({
        ...validEnvironment,
        PHONE_OTP_DRIVER: "fake",
      }),
    ).toThrow(/PHONE_OTP_DRIVER=fake is not allowed in the development environment/);
  });

  it("validates the focused session runtime without unrelated credentials", () => {
    expect(
      parseSessionEnvironment({
        APP_ENV: "development",
        DATABASE_URL: validEnvironment.DATABASE_URL,
        SESSION_SECRET: validEnvironment.SESSION_SECRET,
      }),
    ).toEqual({
      APP_ENV: "development",
      DATABASE_URL: validEnvironment.DATABASE_URL,
    });
  });

  it("validates the focused upload runtime and bounded image limits", () => {
    expect(parseUploadEnvironment(validEnvironment)).toEqual({
      APP_ENV: "development",
      DATABASE_URL: validEnvironment.DATABASE_URL,
      AWS_REGION: validEnvironment.AWS_REGION,
      S3_BUCKET: validEnvironment.S3_BUCKET,
      S3_FORCE_PATH_STYLE: false,
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
      APP_ENV: "development",
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

  it("keeps provider secrets out of web control-plane parsers", () => {
    expect(parseProcessingEnvironment(validEnvironment)).not.toHaveProperty(
      "REMOVEBG_API_KEY",
    );
    expect(parseUploadEnvironment(validEnvironment)).not.toHaveProperty(
      "SESSION_SECRET",
    );
  });

  it("validates bounded image worker settings and provider credentials", () => {
    expect(parseImageWorkerEnvironment(validEnvironment)).toEqual({
      APP_ENV: "development",
      DATABASE_URL: validEnvironment.DATABASE_URL,
      AWS_REGION: validEnvironment.AWS_REGION,
      S3_BUCKET: validEnvironment.S3_BUCKET,
      S3_FORCE_PATH_STYLE: false,
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

  it("validates focused lifecycle cleanup retention bounds", () => {
    expect(parseLifecycleCleanupEnvironment(validEnvironment)).toEqual({
      APP_ENV: "development",
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

  it("validates isolated storage cleanup and retry bounds", () => {
    expect(parseStorageCleanupEnvironment(validEnvironment)).toEqual({
      APP_ENV: "development",
      DATABASE_URL: validEnvironment.DATABASE_URL,
      AWS_REGION: validEnvironment.AWS_REGION,
      S3_BUCKET: validEnvironment.S3_BUCKET,
      S3_FORCE_PATH_STYLE: false,
      STORAGE_CLEANUP_TOKEN: validEnvironment.STORAGE_CLEANUP_TOKEN,
      STORAGE_CLEANUP_BATCH_SIZE: 10,
      ABANDONED_UPLOAD_RETENTION_HOURS: 24,
      STORAGE_DELETION_CLAIM_TTL_MS: 120_000,
      STORAGE_DELETION_MAX_ATTEMPTS: 8,
      STORAGE_DELETION_RETRY_BASE_MS: 30_000,
      STORAGE_DELETION_RETRY_MAX_MS: 3_600_000,
    });
    expect(() =>
      parseStorageCleanupEnvironment({
        ...validEnvironment,
        STORAGE_DELETION_RETRY_BASE_MS: "60000",
        STORAGE_DELETION_RETRY_MAX_MS: "30000",
      }),
    ).toThrow();
  });
});

describe("production redirect URI", () => {
  const productionGoogleAuth = {
    APP_ENV: "production",
    DATABASE_URL: "postgresql://studiocar:secret@db.studiocar.example:5432/studiocar",
    SESSION_SECRET: "production-session-secret-of-at-least-32-characters",
    GOOGLE_CLIENT_ID: "google-client",
    GOOGLE_CLIENT_SECRET: "google-secret",
  };

  it("accepts a local redirect URI outside production", () => {
    expect(
      parseGoogleAuthEnvironment({
        ...validEnvironment,
        GOOGLE_REDIRECT_URI: "http://localhost:3000/api/auth/google/callback",
      }).GOOGLE_REDIRECT_URI,
    ).toBe("http://localhost:3000/api/auth/google/callback");
  });

  it("requires https and a public hostname in production", () => {
    expect(() =>
      parseGoogleAuthEnvironment({
        ...productionGoogleAuth,
        GOOGLE_REDIRECT_URI: "http://app.studiocar.example/api/auth/google/callback",
      }),
    ).toThrow(/public hostname in production/);

    expect(() =>
      parseGoogleAuthEnvironment({
        ...productionGoogleAuth,
        GOOGLE_REDIRECT_URI: "https://localhost/api/auth/google/callback",
      }),
    ).toThrow(/public hostname in production/);

    expect(
      parseGoogleAuthEnvironment({
        ...productionGoogleAuth,
        GOOGLE_REDIRECT_URI: "https://app.studiocar.example/api/auth/google/callback",
      }).GOOGLE_REDIRECT_URI,
    ).toBe("https://app.studiocar.example/api/auth/google/callback");
  });
});

describe("parseAdminBootstrapEnvironment", () => {
  it("reads an empty value as no bootstrap administrator", () => {
    // The example file ships `BOOTSTRAP_ADMIN_EMAIL=` with nothing after it.
    expect(
      parseAdminBootstrapEnvironment({ BOOTSTRAP_ADMIN_EMAIL: "" })
        .BOOTSTRAP_ADMIN_EMAIL,
    ).toBeUndefined();
  });

  it("cleans an address before validating it", () => {
    // `z.email()` checks the format first, so it must run after trimming.
    expect(
      parseAdminBootstrapEnvironment({
        BOOTSTRAP_ADMIN_EMAIL: "  Owner@Example.COM ",
      }).BOOTSTRAP_ADMIN_EMAIL,
    ).toBe("owner@example.com");
  });

  it("refuses a value that is not an address", () => {
    expect(() =>
      parseAdminBootstrapEnvironment({ BOOTSTRAP_ADMIN_EMAIL: "owner" }),
    ).toThrow();
  });
});
