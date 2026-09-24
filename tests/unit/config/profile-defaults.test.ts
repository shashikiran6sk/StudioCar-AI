import { describe, expect, it } from "vitest";

import { AppEnvironment } from "../../../packages/config/src/app-environment";
import { getProfileDefaults } from "../../../packages/config/src/profile-defaults";

/** Credentials of real external services; no profile may ever supply one. */
const EXTERNAL_CREDENTIALS = [
  "REMOVEBG_API_KEY",
  "FAL_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "MSG91_AUTH_KEY",
  "MSG91_WIDGET_ID",
  "MSG91_WIDGET_TOKEN",
  "RESEND_API_KEY",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
];

function flatten(environment: AppEnvironment): Record<string, string> {
  return getProfileDefaults(environment).reduce<Record<string, string>>(
    (merged, group) => ({ ...merged, ...group.values }),
    {},
  );
}

describe("getProfileDefaults", () => {
  it.each(Object.values(AppEnvironment))(
    "never supplies an external credential in %s",
    (environment) => {
      for (const key of EXTERNAL_CREDENTIALS) {
        expect(flatten(environment)).not.toHaveProperty(key);
      }
    },
  );

  it("supplies the whole Local support plane", () => {
    expect(flatten("local")).toMatchObject({
      GOOGLE_AUTH_DRIVER: "fake",
      PHONE_OTP_DRIVER: "fake",
      EMAIL_DRIVER: "mailpit",
      BACKGROUND_REMOVAL_PROVIDER: "removebg",
      DATABASE_URL: "postgresql://studiocar:studiocar@localhost:5432/studiocar",
      S3_ENDPOINT: "http://localhost:9000",
      S3_BUCKET: "studiocar-local",
      S3_FORCE_PATH_STYLE: "true",
      SQS_ENDPOINT: "http://localhost:9324",
      SQS_IMAGE_QUEUE_URL: "http://localhost:9324/000000000000/studiocar-images",
      SQS_EMAIL_QUEUE_URL: "http://localhost:9324/000000000000/studiocar-email",
      MAILPIT_BASE_URL: "http://localhost:8025",
      APPLICATION_BASE_URL: "http://localhost:3000",
    });
  });

  it("leaves Development's database, session secret, and bucket to the developer", () => {
    const development = flatten("development");

    for (const key of ["DATABASE_URL", "SESSION_SECRET", "S3_BUCKET", "S3_ENDPOINT"]) {
      expect(development).not.toHaveProperty(key);
    }
    expect(development).toMatchObject({
      GOOGLE_AUTH_DRIVER: "google",
      PHONE_OTP_DRIVER: "msg91",
      EMAIL_DRIVER: "mailpit",
      SQS_ENDPOINT: "http://localhost:9324",
      MAILPIT_BASE_URL: "http://localhost:8025",
    });
  });

  it("supplies nothing in production but the driver choices", () => {
    expect(flatten("production")).toEqual({
      GOOGLE_AUTH_DRIVER: "google",
      PHONE_OTP_DRIVER: "msg91",
      EMAIL_DRIVER: "resend",
      BACKGROUND_REMOVAL_PROVIDER: "removebg",
    });
  });

  it("applies the local queue connection all or nothing", () => {
    const queueGroup = getProfileDefaults("development").find(
      (group) => group.allOrNothing,
    );

    expect(queueGroup?.values).toHaveProperty("SQS_ENDPOINT");
    expect(queueGroup?.values).toHaveProperty("SQS_ACCESS_KEY_ID");
    expect(getProfileDefaults("production").some((group) => group.allOrNothing)).toBe(
      false,
    );
  });
});
