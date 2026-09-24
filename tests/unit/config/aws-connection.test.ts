import { describe, expect, it } from "vitest";

import {
  createS3ClientOptions,
  createSqsClientOptions,
  S3ConnectionSchema,
  SqsConnectionSchema,
} from "../../../packages/config/src/aws-connection";
import {
  parseImageWorkerEnvironment,
  parseProcessingEnvironment,
  parseStorageCleanupEnvironment,
  parseUploadEnvironment,
} from "../../../packages/config/src/environment";

const databaseUrl = "postgresql://studiocar:secret@localhost:5432/studiocar";
const accessKeyId = "AKIAEXAMPLEEXAMPLE00";
const secretAccessKey = "example-secret-access-key-value-0000";

// Development: AWS S3 by default, and a database the developer names.
const baseUploadEnvironment = {
  APP_ENV: "development",
  DATABASE_URL: databaseUrl,
  AWS_REGION: "ap-south-1",
  S3_BUCKET: "studiocar-private",
};

describe("S3 connection configuration", () => {
  it("keeps the AWS default credential chain when no keys are configured", () => {
    const connection = S3ConnectionSchema.parse({ AWS_REGION: "ap-south-1" });

    expect(createS3ClientOptions(connection)).toStrictEqual({
      region: "ap-south-1",
      forcePathStyle: false,
    });
  });

  it("supplies explicit credentials and an emulator endpoint when configured", () => {
    const connection = S3ConnectionSchema.parse({
      AWS_REGION: "ap-south-1",
      S3_ENDPOINT: "http://localhost:9000",
      S3_FORCE_PATH_STYLE: "true",
      S3_ACCESS_KEY_ID: accessKeyId,
      S3_SECRET_ACCESS_KEY: secretAccessKey,
    });

    expect(createS3ClientOptions(connection)).toStrictEqual({
      region: "ap-south-1",
      endpoint: "http://localhost:9000",
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  });

  it("reads empty settings as not set rather than invalid", () => {
    // The example file tells a deployment to leave these empty.
    const connection = S3ConnectionSchema.parse({
      AWS_REGION: "ap-south-1",
      S3_ENDPOINT: "",
      S3_FORCE_PATH_STYLE: "",
      S3_ACCESS_KEY_ID: "",
      S3_SECRET_ACCESS_KEY: "",
    });

    expect(createS3ClientOptions(connection)).toStrictEqual({
      region: "ap-south-1",
      forcePathStyle: false,
    });
  });

  it("still fails closed when a key id arrives without its secret", () => {
    // An empty secret must not quietly fall back to the default credentials.
    expect(() =>
      parseUploadEnvironment({
        ...baseUploadEnvironment,
        S3_ACCESS_KEY_ID: accessKeyId,
        S3_SECRET_ACCESS_KEY: "",
      }),
    ).toThrow(/must be configured together/);
  });

  it("treats an absent path-style flag as disabled", () => {
    expect(
      S3ConnectionSchema.parse({ AWS_REGION: "ap-south-1" })
        .S3_FORCE_PATH_STYLE,
    ).toBe(false);
  });

  it.each([
    ["1", true],
    ["true", true],
    ["0", false],
    ["false", false],
  ])("reads the path-style flag %s as %s", (value, expected) => {
    expect(
      S3ConnectionSchema.parse({
        AWS_REGION: "ap-south-1",
        S3_FORCE_PATH_STYLE: value,
      }).S3_FORCE_PATH_STYLE,
    ).toBe(expected);
  });

  it("rejects an unrecognised path-style flag rather than guessing", () => {
    expect(() =>
      S3ConnectionSchema.parse({
        AWS_REGION: "ap-south-1",
        S3_FORCE_PATH_STYLE: "yes",
      }),
    ).toThrow();
  });
});

describe("upload environment", () => {
  it("parses a deployed configuration that relies on workload identity", () => {
    const environment = parseUploadEnvironment(baseUploadEnvironment);

    expect(createS3ClientOptions(environment)).toStrictEqual({
      region: "ap-south-1",
      forcePathStyle: false,
    });
  });

  it("parses a local emulator configuration", () => {
    const environment = parseUploadEnvironment({
      ...baseUploadEnvironment,
      APP_ENV: "local",
      S3_ENDPOINT: "http://localhost:9000",
      S3_FORCE_PATH_STYLE: "true",
      S3_ACCESS_KEY_ID: accessKeyId,
      S3_SECRET_ACCESS_KEY: secretAccessKey,
    });

    expect(createS3ClientOptions(environment)).toStrictEqual({
      region: "ap-south-1",
      endpoint: "http://localhost:9000",
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  });

  it("fails closed when only an access key id is configured", () => {
    expect(() =>
      parseUploadEnvironment({
        ...baseUploadEnvironment,
        S3_ACCESS_KEY_ID: accessKeyId,
      }),
    ).toThrow(/must be configured together/);
  });

  it("fails closed when only a secret access key is configured", () => {
    expect(() =>
      parseUploadEnvironment({
        ...baseUploadEnvironment,
        S3_SECRET_ACCESS_KEY: secretAccessKey,
      }),
    ).toThrow(/must be configured together/);
  });

  it("ignores unrelated secrets that share the process environment", () => {
    const environment = parseUploadEnvironment({
      ...baseUploadEnvironment,
      REMOVEBG_API_KEY: "must-not-cross-this-boundary",
    });

    expect(Object.keys(environment)).not.toContain("REMOVEBG_API_KEY");
  });
});

describe("storage cleanup and image worker environments", () => {
  it("accepts the same S3 connection fields for storage cleanup", () => {
    const environment = parseStorageCleanupEnvironment({
      APP_ENV: "local",
      DATABASE_URL: databaseUrl,
      AWS_REGION: "ap-south-1",
      S3_BUCKET: "studiocar-private",
      STORAGE_CLEANUP_TOKEN: "a".repeat(32),
      S3_ENDPOINT: "http://localhost:9000",
      S3_FORCE_PATH_STYLE: "true",
      S3_ACCESS_KEY_ID: accessKeyId,
      S3_SECRET_ACCESS_KEY: secretAccessKey,
    });

    expect(createS3ClientOptions(environment).endpoint).toBe(
      "http://localhost:9000",
    );
  });

  it("still enforces the storage deletion retry bound alongside credentials", () => {
    expect(() =>
      parseStorageCleanupEnvironment({
        APP_ENV: "development",
        DATABASE_URL: databaseUrl,
        AWS_REGION: "ap-south-1",
        S3_BUCKET: "studiocar-private",
        STORAGE_CLEANUP_TOKEN: "a".repeat(32),
        STORAGE_DELETION_RETRY_BASE_MS: "60000",
        STORAGE_DELETION_RETRY_MAX_MS: "30000",
      }),
    ).toThrow(/retry maximum must be at least the retry base/);
  });

  it("accepts the same S3 connection fields for the image worker", () => {
    const environment = parseImageWorkerEnvironment({
      APP_ENV: "local",
      DATABASE_URL: databaseUrl,
      AWS_REGION: "ap-south-1",
      S3_BUCKET: "studiocar-private",
      BACKGROUND_REMOVAL_PROVIDER: "removebg",
      REMOVEBG_API_KEY: "provider-key",
      S3_ENDPOINT: "http://minio:9000",
      S3_FORCE_PATH_STYLE: "1",
      S3_ACCESS_KEY_ID: accessKeyId,
      S3_SECRET_ACCESS_KEY: secretAccessKey,
    });

    expect(createS3ClientOptions(environment)).toStrictEqual({
      region: "ap-south-1",
      endpoint: "http://minio:9000",
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  });

  it("starts when only the selected provider is configured", () => {
    // docker-compose sends every provider's setting, so the two not in use
    // arrive as empty strings. They used to stop the worker from starting.
    const environment = parseImageWorkerEnvironment({
      APP_ENV: "development",
      DATABASE_URL: databaseUrl,
      AWS_REGION: "ap-south-1",
      S3_BUCKET: "studiocar-private",
      S3_ENDPOINT: "https://s3.ap-south-1.amazonaws.com",
      S3_FORCE_PATH_STYLE: "",
      BACKGROUND_REMOVAL_PROVIDER: "removebg",
      REMOVEBG_API_KEY: "provider-key",
      FAL_KEY: "",
      SELF_HOSTED_BIREFNET_ENDPOINT: "",
    });

    expect(environment.REMOVEBG_API_KEY).toBe("provider-key");
    expect(environment.FAL_KEY).toBeUndefined();
    expect(environment.SELF_HOSTED_BIREFNET_ENDPOINT).toBeUndefined();
  });

  it("still refuses an empty key for the selected provider", () => {
    expect(() =>
      parseImageWorkerEnvironment({
        APP_ENV: "development",
        DATABASE_URL: databaseUrl,
        AWS_REGION: "ap-south-1",
        S3_BUCKET: "studiocar-private",
        BACKGROUND_REMOVAL_PROVIDER: "removebg",
        REMOVEBG_API_KEY: "",
      }),
    ).toThrow(/REMOVEBG_API_KEY is required/);
  });

  it("still requires the selected provider credential", () => {
    expect(() =>
      parseImageWorkerEnvironment({
        APP_ENV: "development",
        DATABASE_URL: databaseUrl,
        AWS_REGION: "ap-south-1",
        S3_BUCKET: "studiocar-private",
        BACKGROUND_REMOVAL_PROVIDER: "fal",
      }),
    ).toThrow(/FAL_KEY is required/);
  });
});

describe("SQS connection configuration", () => {
  it("keeps the AWS default credential chain when no keys are configured", () => {
    const connection = SqsConnectionSchema.parse({ AWS_REGION: "ap-south-1" });

    expect(createSqsClientOptions(connection)).toStrictEqual({
      region: "ap-south-1",
    });
  });

  it("reads empty settings as not set rather than invalid", () => {
    const connection = SqsConnectionSchema.parse({
      AWS_REGION: "ap-south-1",
      SQS_ENDPOINT: "",
      SQS_ACCESS_KEY_ID: "",
      SQS_SECRET_ACCESS_KEY: "",
    });

    expect(createSqsClientOptions(connection)).toStrictEqual({
      region: "ap-south-1",
    });
  });

  it("supplies an emulator endpoint and explicit credentials", () => {
    const environment = parseProcessingEnvironment({
      APP_ENV: "local",
      DATABASE_URL: databaseUrl,
      AWS_REGION: "ap-south-1",
      SQS_IMAGE_QUEUE_URL: "http://localhost:9324/queue/studiocar-images",
      SQS_ENDPOINT: "http://localhost:9324",
      SQS_ACCESS_KEY_ID: accessKeyId,
      SQS_SECRET_ACCESS_KEY: secretAccessKey,
      BACKGROUND_REMOVAL_PROVIDER: "removebg",
      PROCESSING_DISPATCH_TOKEN: "b".repeat(32),
    });

    expect(createSqsClientOptions(environment)).toStrictEqual({
      region: "ap-south-1",
      endpoint: "http://localhost:9324",
      credentials: { accessKeyId, secretAccessKey },
    });
  });

  it("fails closed on half-configured queue credentials", () => {
    expect(() =>
      parseProcessingEnvironment({
        APP_ENV: "local",
        DATABASE_URL: databaseUrl,
        AWS_REGION: "ap-south-1",
        SQS_IMAGE_QUEUE_URL: "http://localhost:9324/queue/studiocar-images",
        SQS_ACCESS_KEY_ID: accessKeyId,
        BACKGROUND_REMOVAL_PROVIDER: "removebg",
        PROCESSING_DISPATCH_TOKEN: "b".repeat(32),
      }),
    ).toThrow(/must be configured together/);
  });

  it("still enforces the processing retry bound alongside credentials", () => {
    expect(() =>
      parseProcessingEnvironment({
        APP_ENV: "local",
        DATABASE_URL: databaseUrl,
        AWS_REGION: "ap-south-1",
        SQS_IMAGE_QUEUE_URL: "http://localhost:9324/queue/studiocar-images",
        BACKGROUND_REMOVAL_PROVIDER: "removebg",
        PROCESSING_DISPATCH_TOKEN: "b".repeat(32),
        PROCESSING_OUTBOX_RETRY_BASE_MS: "60000",
        PROCESSING_OUTBOX_RETRY_MAX_MS: "1000",
      }),
    ).toThrow(/retry maximum must be at least the retry base/);
  });
});
