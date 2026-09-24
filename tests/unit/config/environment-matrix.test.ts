import { describe, expect, it } from "vitest";

import {
  parseGoogleAuthEnvironment,
  parseImageWorkerEnvironment,
  parseImageWorkerQueueEnvironment,
  parsePhoneAuthEnvironment,
  parseProcessingEnvironment,
  parseUploadEnvironment,
} from "../../../packages/config/src/environment";
import {
  APPLICATION_PARSERS,
  DEVELOPMENT_ENVIRONMENT,
  LOCAL_CONSUMER_PARSERS,
  LOCAL_ENVIRONMENT,
  parseError,
  PRODUCTION_ENVIRONMENT,
  WORKER_PARSERS,
} from "./environment-fixtures";

const EVERY_LOCAL_PROCESS = [
  ...APPLICATION_PARSERS,
  ...WORKER_PARSERS,
  ...LOCAL_CONSUMER_PARSERS,
];

describe("Local environment", () => {
  it.each(EVERY_LOCAL_PROCESS)(
    "starts the %s from APP_ENV and a remove.bg key alone",
    (_name, parser) => {
      expect(parseError(parser, LOCAL_ENVIRONMENT)).toBeUndefined();
    },
  );

  it("selects fake Google, fake OTP, MinIO, ElasticMQ, and remove.bg", () => {
    expect(parseGoogleAuthEnvironment(LOCAL_ENVIRONMENT).GOOGLE_AUTH_DRIVER).toBe("fake");
    expect(parsePhoneAuthEnvironment(LOCAL_ENVIRONMENT).PHONE_OTP_DRIVER).toBe("fake");
    expect(parseUploadEnvironment(LOCAL_ENVIRONMENT)).toMatchObject({
      S3_ENDPOINT: "http://localhost:9000",
      S3_BUCKET: "studiocar-local",
      S3_FORCE_PATH_STYLE: true,
    });
    expect(parseProcessingEnvironment(LOCAL_ENVIRONMENT)).toMatchObject({
      SQS_ENDPOINT: "http://localhost:9324",
      SQS_IMAGE_QUEUE_URL: "http://localhost:9324/000000000000/studiocar-images",
    });
    expect(
      parseImageWorkerEnvironment(LOCAL_ENVIRONMENT).BACKGROUND_REMOVAL_PROVIDER,
    ).toBe("removebg");
  });

  it("requires the remove.bg key for the image worker", () => {
    expect(
      parseError(parseImageWorkerEnvironment, { APP_ENV: "local" }),
    ).toMatch(/REMOVEBG_API_KEY is required/);
  });
});

describe("Development environment", () => {
  it.each(EVERY_LOCAL_PROCESS)("starts the %s", (_name, parser) => {
    expect(parseError(parser, DEVELOPMENT_ENVIRONMENT)).toBeUndefined();
  });

  it("selects real Google, real MSG91, AWS S3, and AWS SQS", () => {
    expect(parseGoogleAuthEnvironment(DEVELOPMENT_ENVIRONMENT).GOOGLE_AUTH_DRIVER).toBe(
      "google",
    );
    expect(parsePhoneAuthEnvironment(DEVELOPMENT_ENVIRONMENT).PHONE_OTP_DRIVER).toBe(
      "msg91",
    );
    const upload = parseUploadEnvironment(DEVELOPMENT_ENVIRONMENT);
    expect(upload.S3_ENDPOINT).toBeUndefined();
    expect(upload.S3_BUCKET).toBe("studiocar-dev-images");
    const processing = parseProcessingEnvironment(DEVELOPMENT_ENVIRONMENT);
    expect(processing.SQS_ENDPOINT).toBeUndefined();
    expect(processing.SQS_ACCESS_KEY_ID).toBeUndefined();
    expect(processing.SQS_IMAGE_QUEUE_URL).toBe(
      DEVELOPMENT_ENVIRONMENT.SQS_IMAGE_QUEUE_URL,
    );
  });

  it.each([parseProcessingEnvironment, parseImageWorkerQueueEnvironment])(
    "requires its own AWS SQS queue instead of defaulting to ElasticMQ",
    (parser) => {
      expect(
        parseError(parser, {
          ...DEVELOPMENT_ENVIRONMENT,
          SQS_IMAGE_QUEUE_URL: undefined,
        }),
      ).toContain("SQS_IMAGE_QUEUE_URL");
    },
  );

  it.each([
    "http://elasticmq:9324/000000000000/studiocar-images",
    "http://localhost:9324/000000000000/studiocar-images",
  ])("refuses the local queue %s", (queueUrl) => {
    for (const parser of [parseProcessingEnvironment, parseImageWorkerQueueEnvironment]) {
      expect(
        parseError(parser, {
          ...DEVELOPMENT_ENVIRONMENT,
          SQS_IMAGE_QUEUE_URL: queueUrl,
        }),
      ).toMatch(/must be an AWS SQS queue in development; local ElasticMQ is refused/);
    }
  });

  it("refuses the ElasticMQ endpoint and emulator key beside its AWS queue", () => {
    expect(
      parseError(parseImageWorkerQueueEnvironment, {
        ...DEVELOPMENT_ENVIRONMENT,
        SQS_ENDPOINT: "http://elasticmq:9324",
        SQS_ACCESS_KEY_ID: "studiocarlocal",
        SQS_SECRET_ACCESS_KEY: "studiocarlocal123",
      }),
    ).toMatch(/SQS_ENDPOINT must be an AWS SQS queue[\s\S]*local emulator key/);
  });

  it.each(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"])(
    "refuses to start Google sign-in without %s",
    (key) => {
      expect(
        parseError(parseGoogleAuthEnvironment, {
          ...DEVELOPMENT_ENVIRONMENT,
          [key]: undefined,
        }),
      ).toMatch(new RegExp(`${key} is required`));
    },
  );

  it.each(["MSG91_WIDGET_ID", "MSG91_WIDGET_TOKEN", "MSG91_AUTH_KEY"])(
    "refuses to start phone sign-in without %s instead of faking it",
    (key) => {
      expect(
        parseError(parsePhoneAuthEnvironment, {
          ...DEVELOPMENT_ENVIRONMENT,
          [key]: undefined,
        }),
      ).toMatch(new RegExp(`${key} is required`));
    },
  );

  it("refuses the fake drivers even when asked for them", () => {
    expect(
      parseError(parseGoogleAuthEnvironment, {
        ...DEVELOPMENT_ENVIRONMENT,
        GOOGLE_AUTH_DRIVER: "fake",
      }),
    ).toMatch(/GOOGLE_AUTH_DRIVER=fake is not allowed/);
    expect(
      parseError(parsePhoneAuthEnvironment, {
        ...DEVELOPMENT_ENVIRONMENT,
        PHONE_OTP_DRIVER: "fake",
      }),
    ).toMatch(/PHONE_OTP_DRIVER=fake is not allowed/);
  });

  it("requires its own database, session secret, and bucket", () => {
    for (const key of ["DATABASE_URL", "SESSION_SECRET"]) {
      expect(
        parseError(parseGoogleAuthEnvironment, {
          ...DEVELOPMENT_ENVIRONMENT,
          [key]: undefined,
        }),
      ).toContain(key);
    }
    expect(
      parseError(parseUploadEnvironment, {
        ...DEVELOPMENT_ENVIRONMENT,
        S3_BUCKET: undefined,
      }),
    ).toContain("S3_BUCKET");
  });
});

describe("Production environment", () => {
  it.each([...APPLICATION_PARSERS, ...WORKER_PARSERS])(
    "starts the %s from a complete production configuration",
    (_name, parser) => {
      expect(parseError(parser, PRODUCTION_ENVIRONMENT)).toBeUndefined();
    },
  );

  it.each(LOCAL_CONSUMER_PARSERS)("refuses to run the %s", (_name, parser) => {
    expect(parseError(parser, PRODUCTION_ENVIRONMENT)).toMatch(
      /cannot run in production/,
    );
  });

  it("selects real Google, MSG91, and remove.bg with nothing local", () => {
    expect(parseGoogleAuthEnvironment(PRODUCTION_ENVIRONMENT).GOOGLE_AUTH_DRIVER).toBe(
      "google",
    );
    expect(parsePhoneAuthEnvironment(PRODUCTION_ENVIRONMENT).PHONE_OTP_DRIVER).toBe(
      "msg91",
    );
    expect(parseUploadEnvironment(PRODUCTION_ENVIRONMENT).S3_ENDPOINT).toBeUndefined();
    expect(
      parseProcessingEnvironment(PRODUCTION_ENVIRONMENT).SQS_ENDPOINT,
    ).toBeUndefined();
  });

  it.each([
    ["fake Google", parseGoogleAuthEnvironment, { GOOGLE_AUTH_DRIVER: "fake" }, /GOOGLE_AUTH_DRIVER=fake/],
    ["fake OTP", parsePhoneAuthEnvironment, { PHONE_OTP_DRIVER: "fake" }, /PHONE_OTP_DRIVER=fake/],
    ["MinIO", parseUploadEnvironment, { S3_ENDPOINT: "http://minio:9000" }, /local MinIO is refused/],
    ["a localhost S3 endpoint", parseImageWorkerEnvironment, { S3_ENDPOINT: "http://localhost:9000" }, /local MinIO is refused/],
    ["ElasticMQ", parseProcessingEnvironment, { SQS_IMAGE_QUEUE_URL: "http://elasticmq:9324/000000000000/studiocar-images" }, /local ElasticMQ is refused/],
    ["a localhost queue", parseProcessingEnvironment, { SQS_IMAGE_QUEUE_URL: "http://localhost:9324/000000000000/studiocar-images" }, /local ElasticMQ is refused/],
    ["a Development bucket", parseUploadEnvironment, { S3_BUCKET: "studiocar-dev-images" }, /non-production environment/],
    ["the local bucket", parseImageWorkerEnvironment, { S3_BUCKET: "studiocar-local" }, /must not be the local bucket/],
    ["the local emulator key", parseUploadEnvironment, { S3_ACCESS_KEY_ID: "studiocarlocal", S3_SECRET_ACCESS_KEY: "studiocarlocal123" }, /local emulator key/],
    ["a local database", parseImageWorkerEnvironment, { DATABASE_URL: "postgresql://studiocar:studiocar@localhost:5432/studiocar" }, /must not address a local database/],
    ["the committed session secret", parseGoogleAuthEnvironment, { SESSION_SECRET: "local-development-session-secret-000000" }, /committed local value/],
    ["a committed dispatch token", parseProcessingEnvironment, { PROCESSING_DISPATCH_TOKEN: "local-processing-dispatch-token-000000" }, /committed local value/],
    ["an http redirect URI", parseGoogleAuthEnvironment, { GOOGLE_REDIRECT_URI: "http://localhost:3000/api/auth/google/callback" }, /GOOGLE_REDIRECT_URI must be an https URL/],
  ] as const)("refuses %s", (_name, parser, override, message) => {
    expect(parseError(parser, { ...PRODUCTION_ENVIRONMENT, ...override })).toMatch(
      message,
    );
  });

  it.each([
    ["MSG91 credentials", parsePhoneAuthEnvironment, "MSG91_AUTH_KEY"],
    ["Google credentials", parseGoogleAuthEnvironment, "GOOGLE_CLIENT_SECRET"],
    ["a bucket", parseUploadEnvironment, "S3_BUCKET"],
    ["a processing queue", parseProcessingEnvironment, "SQS_IMAGE_QUEUE_URL"],
    ["a dispatch token", parseProcessingEnvironment, "PROCESSING_DISPATCH_TOKEN"],
    ["a session secret", parsePhoneAuthEnvironment, "SESSION_SECRET"],
  ] as const)("fails closed without %s", (_name, parser, key) => {
    expect(parseError(parser, { ...PRODUCTION_ENVIRONMENT, [key]: undefined })).toContain(
      key,
    );
  });
});

describe("APP_ENV", () => {
  it.each(EVERY_LOCAL_PROCESS)("is required by the %s", (_name, parser) => {
    if (_name === "admin bootstrap") return;
    const { APP_ENV: _omitted, ...withoutEnvironment } = DEVELOPMENT_ENVIRONMENT;

    expect(parseError(parser, withoutEnvironment)).toMatch(/APP_ENV must be one of/);
  });

  it("is independent of NODE_ENV", () => {
    expect(
      parseError(parseUploadEnvironment, {
        ...DEVELOPMENT_ENVIRONMENT,
        NODE_ENV: "production",
      }),
    ).toBeUndefined();
    expect(
      parseGoogleAuthEnvironment({ ...LOCAL_ENVIRONMENT, NODE_ENV: "production" })
        .GOOGLE_AUTH_DRIVER,
    ).toBe("fake");
  });
});
