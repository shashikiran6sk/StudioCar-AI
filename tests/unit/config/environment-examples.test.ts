import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { describe, expect, it } from "vitest";

import {
  AdminBootstrapEnvironmentSchema,
  EmailDispatchEnvironmentSchema,
  EmailWorkerEnvironmentSchema,
  EmailWorkerQueueEnvironmentSchema,
  GoogleAuthEnvironmentSchema,
  ImageWorkerEnvironmentSchema,
  ImageWorkerQueueEnvironmentSchema,
  LifecycleCleanupEnvironmentSchema,
  PhoneAuthEnvironmentSchema,
  PhoneOtpWidgetEnvironmentSchema,
  ProcessingEnvironmentSchema,
  SessionEnvironmentSchema,
  StorageCleanupEnvironmentSchema,
  UploadEnvironmentSchema,
} from "../../../packages/config/src/environment";
import {
  APPLICATION_PARSERS,
  DEVELOPMENT_ENVIRONMENT,
  type EnvironmentValues,
  LOCAL_CONSUMER_PARSERS,
  LOCAL_ENVIRONMENT,
  parseError,
  PRODUCTION_ENVIRONMENT,
  WORKER_PARSERS,
} from "./environment-fixtures";

const repositoryRoot = path.resolve(import.meta.dirname, "../../..");

/** Every variable some runtime actually reads. */
const KNOWN_VARIABLES = new Set(
  [
    SessionEnvironmentSchema,
    PhoneOtpWidgetEnvironmentSchema,
    PhoneAuthEnvironmentSchema,
    AdminBootstrapEnvironmentSchema,
    GoogleAuthEnvironmentSchema,
    UploadEnvironmentSchema,
    EmailWorkerEnvironmentSchema,
    EmailDispatchEnvironmentSchema,
    LifecycleCleanupEnvironmentSchema,
    StorageCleanupEnvironmentSchema,
    ProcessingEnvironmentSchema,
    ImageWorkerQueueEnvironmentSchema,
    EmailWorkerQueueEnvironmentSchema,
    ImageWorkerEnvironmentSchema,
  ].flatMap((schema) => Object.keys(schema.shape)),
);

/** Names that no longer exist, or never did, and must not be documented. */
const RETIRED_VARIABLES = [
  "NODE_ENV",
  "MSG91_TEMPLATE_ID",
  "NEXT_PUBLIC_APP_URL",
  "REMOVE_BG_API_KEY",
  "MAIL_FROM",
  "PROCESSING_QUEUE_URL",
  "EMAIL_QUEUE_URL",
  "STORAGE_DRIVER",
  "QUEUE_DRIVER",
];

/** Settings that exist only to point at local infrastructure or fakes. */
const LOCAL_ONLY_VARIABLES = [
  "PHONE_OTP_DEV_CODE",
  "MAILPIT_BASE_URL",
  "S3_ENDPOINT",
  "S3_FORCE_PATH_STYLE",
  "SQS_ENDPOINT",
  "SQS_ACCESS_KEY_ID",
  "SQS_SECRET_ACCESS_KEY",
];

/** Selections the profile makes; an example repeating them is redundant. */
const PROFILE_SELECTIONS = [
  "GOOGLE_AUTH_DRIVER",
  "PHONE_OTP_DRIVER",
  "EMAIL_DRIVER",
  "BACKGROUND_REMOVAL_PROVIDER",
];

interface ExampleCase {
  appEnvironment: string;
  placeholders: EnvironmentValues;
  parsers: readonly [string, (environment: EnvironmentValues) => unknown][];
  /** Documented, but the environment starts without them. */
  optional: readonly string[];
}

const EXAMPLES: Record<string, ExampleCase> = {
  ".env.example.local": {
    appEnvironment: "local",
    placeholders: LOCAL_ENVIRONMENT,
    parsers: [...APPLICATION_PARSERS, ...WORKER_PARSERS, ...LOCAL_CONSUMER_PARSERS],
    optional: [],
  },
  ".env.example.development": {
    appEnvironment: "development",
    placeholders: DEVELOPMENT_ENVIRONMENT,
    parsers: [...APPLICATION_PARSERS, ...WORKER_PARSERS, ...LOCAL_CONSUMER_PARSERS],
    optional: [
      "AWS_REGION",
      "GOOGLE_REDIRECT_URI",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
      "BOOTSTRAP_ADMIN_EMAIL",
    ],
  },
  ".env.example.production": {
    appEnvironment: "production",
    placeholders: PRODUCTION_ENVIRONMENT,
    parsers: [...APPLICATION_PARSERS, ...WORKER_PARSERS],
    optional: ["BOOTSTRAP_ADMIN_EMAIL"],
  },
};

function readExample(file: string): EnvironmentValues {
  return parseEnv(readFileSync(path.join(repositoryRoot, file), "utf8"));
}

/** The example as a developer would complete it: blanks get placeholders. */
function completeExample(file: string, placeholders: EnvironmentValues): EnvironmentValues {
  const example = readExample(file);
  return Object.fromEntries(
    Object.entries(example).map(([key, value]) => [
      key,
      value === "" ? placeholders[key] ?? "" : value,
    ]),
  );
}

function failingParsers(
  parsers: ExampleCase["parsers"],
  environment: EnvironmentValues,
): string[] {
  return parsers
    .filter(([, parser]) => parseError(parser, environment) !== undefined)
    .map(([name]) => name);
}

describe("environment example files", () => {
  it("are exactly the three per-environment examples", () => {
    for (const file of Object.keys(EXAMPLES)) {
      expect(existsSync(path.join(repositoryRoot, file)), file).toBe(true);
    }
    expect(existsSync(path.join(repositoryRoot, ".env.example"))).toBe(false);
    expect(existsSync(path.join(repositoryRoot, "apps/web/.env.example"))).toBe(false);
  });

  describe.each(Object.entries(EXAMPLES))("%s", (file, example) => {
    const documented = Object.keys(readExample(file));

    it("declares the environment its name promises", () => {
      expect(readExample(file)["APP_ENV"]).toBe(example.appEnvironment);
    });

    it("documents only variables a runtime reads", () => {
      expect(documented.filter((key) => !KNOWN_VARIABLES.has(key))).toEqual([]);
    });

    it("documents no retired variable, local-only setting, or profile selection", () => {
      for (const key of [
        ...RETIRED_VARIABLES,
        ...LOCAL_ONLY_VARIABLES,
        ...PROFILE_SELECTIONS,
      ]) {
        expect(documented, key).not.toContain(key);
      }
    });

    it("starts every runtime once its blanks are filled in", () => {
      expect(
        failingParsers(
          example.parsers,
          completeExample(file, example.placeholders),
        ),
      ).toEqual([]);
    });

    it("marks as optional exactly what the environment can start without", () => {
      const complete = completeExample(file, example.placeholders);
      for (const key of documented) {
        const failures = failingParsers(example.parsers, {
          ...complete,
          [key]: undefined,
        });
        if (example.optional.includes(key)) {
          expect(failures, `${key} is marked optional`).toEqual([]);
        } else {
          expect(failures.length, `${key} is documented as required`).toBeGreaterThan(0);
        }
      }
    });
  });

  it("asks a Local developer for nothing but the remove.bg key", () => {
    expect(Object.keys(readExample(".env.example.local")).sort()).toEqual([
      "APP_ENV",
      "REMOVEBG_API_KEY",
    ]);
  });

  it("requires the real Google and MSG91 credentials in Development", () => {
    const documented = Object.keys(readExample(".env.example.development"));

    for (const key of [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "MSG91_WIDGET_ID",
      "MSG91_WIDGET_TOKEN",
      "MSG91_AUTH_KEY",
      "S3_BUCKET",
      "DATABASE_URL",
    ]) {
      expect(documented).toContain(key);
    }
  });

  it("keeps Resend and production queues out of Development", () => {
    const documented = Object.keys(readExample(".env.example.development"));

    for (const key of ["RESEND_API_KEY", "SQS_IMAGE_QUEUE_URL", "SQS_EMAIL_QUEUE_URL"]) {
      expect(documented).not.toContain(key);
    }
  });

  it("ships no value for any production setting but APP_ENV", () => {
    const production = readExample(".env.example.production");

    for (const [key, value] of Object.entries(production)) {
      if (key !== "APP_ENV") expect(value, key).toBe("");
    }
  });
});
