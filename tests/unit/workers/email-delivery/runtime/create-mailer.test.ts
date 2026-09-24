import { describe, expect, it } from "vitest";

import { createMailer } from "../../../../../workers/email-delivery/src/runtime/create-mailer";
import { MailpitMailer } from "../../../../../workers/email-delivery/src/mailpit-mailer";
import { ResendMailer } from "../../../../../workers/email-delivery/src/resend-mailer";
import { parseEmailWorkerEnvironment } from "../../../../../packages/config/src/environment";

const base = {
  APP_ENV: "development",
  APPLICATION_BASE_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://studiocar:secret@localhost:5432/studiocar",
  EMAIL_FROM: "no-reply@studiocar.local",
};

describe("createMailer", () => {
  const production = {
    ...base,
    APP_ENV: "production",
    APPLICATION_BASE_URL: "https://app.studiocar.example",
    DATABASE_URL: "postgresql://studiocar:secret@db.studiocar.example:5432/studiocar",
    EMAIL_FROM: "no-reply@studiocar.example",
  };

  it("selects Resend by default in production", () => {
    const mailer = createMailer(
      parseEmailWorkerEnvironment({ ...production, RESEND_API_KEY: "resend-key" }),
    );

    expect(mailer).toBeInstanceOf(ResendMailer);
  });

  it("selects the local inbox by default in Local and Development", () => {
    for (const appEnvironment of ["local", "development"]) {
      const mailer = createMailer(
        parseEmailWorkerEnvironment({ ...base, APP_ENV: appEnvironment }),
      );

      expect(mailer).toBeInstanceOf(MailpitMailer);
    }
  });

  it("refuses the local inbox in production", () => {
    expect(() =>
      parseEmailWorkerEnvironment({
        ...production,
        RESEND_API_KEY: "resend-key",
        EMAIL_DRIVER: "mailpit",
        MAILPIT_BASE_URL: "http://mailpit:8025",
      }),
    ).toThrow(/EMAIL_DRIVER=mailpit is not allowed in the production environment/);
  });

  it("allows a deliberate Resend override in Development", () => {
    const mailer = createMailer(
      parseEmailWorkerEnvironment({
        ...base,
        EMAIL_DRIVER: "resend",
        RESEND_API_KEY: "resend-key",
      }),
    );

    expect(mailer).toBeInstanceOf(ResendMailer);
  });

  it("requires the provider key when the resend driver is selected", () => {
    expect(() => parseEmailWorkerEnvironment(production)).toThrow(
      /RESEND_API_KEY is required/,
    );
  });
});
