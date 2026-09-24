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
    "supplies no email-delivery setting in %s",
    (environment) => {
      expect(
        Object.keys(flatten(environment)).filter((key) =>
          /^(EMAIL_|MAIL|RESEND_|SQS_EMAIL_|APPLICATION_BASE_URL)/.test(key),
        ),
      ).toEqual([]);
    },
  );

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
      BACKGROUND_REMOVAL_PROVIDER: "removebg",
      DATABASE_URL: "postgresql://studiocar:studiocar@localhost:5432/studiocar",
      S3_ENDPOINT: "http://localhost:9000",
      S3_BUCKET: "studiocar-local",
      S3_FORCE_PATH_STYLE: "true",
      SQS_ENDPOINT: "http://localhost:9324",
      SQS_IMAGE_QUEUE_URL: "http://localhost:9324/000000000000/studiocar-images",
    });
  });

  it("leaves Development's database, session secret, bucket, and queue to the developer", () => {
    const development = flatten("development");

    for (const key of [
      "DATABASE_URL",
      "SESSION_SECRET",
      "AWS_REGION",
      "S3_BUCKET",
      "S3_ENDPOINT",
      "SQS_ENDPOINT",
      "SQS_ACCESS_KEY_ID",
      "SQS_SECRET_ACCESS_KEY",
      "SQS_IMAGE_QUEUE_URL",
    ]) {
      expect(development).not.toHaveProperty(key);
    }
    expect(development).toMatchObject({
      GOOGLE_AUTH_DRIVER: "google",
      PHONE_OTP_DRIVER: "msg91",
    });
  });

  it("supplies nothing in production but the driver choices", () => {
    expect(flatten("production")).toEqual({
      GOOGLE_AUTH_DRIVER: "google",
      PHONE_OTP_DRIVER: "msg91",
      BACKGROUND_REMOVAL_PROVIDER: "removebg",
    });
  });

  it("applies the local queue connection all or nothing, in Local only", () => {
    const queueGroup = getProfileDefaults("local").find(
      (group) => group.allOrNothing,
    );

    expect(queueGroup?.values).toHaveProperty("SQS_ENDPOINT");
    expect(queueGroup?.values).toHaveProperty("SQS_ACCESS_KEY_ID");
    for (const environment of ["development", "production"] as const) {
      expect(
        getProfileDefaults(environment).some((group) => group.allOrNothing),
      ).toBe(false);
    }
  });
});
