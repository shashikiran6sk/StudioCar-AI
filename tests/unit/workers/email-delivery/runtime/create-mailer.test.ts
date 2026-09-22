import { describe, expect, it } from "vitest";

import { createMailer } from "../../../../../workers/email-delivery/src/runtime/create-mailer";
import { MailpitMailer } from "../../../../../workers/email-delivery/src/mailpit-mailer";
import { ResendMailer } from "../../../../../workers/email-delivery/src/resend-mailer";
import { parseEmailWorkerEnvironment } from "../../../../../packages/config/src/environment";

const base = {
  APPLICATION_BASE_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://studiocar:secret@localhost:5432/studiocar",
  EMAIL_FROM: "no-reply@studiocar.local",
};

describe("createMailer", () => {
  it("selects the production provider by default", () => {
    const mailer = createMailer(
      parseEmailWorkerEnvironment({ ...base, RESEND_API_KEY: "resend-key" }),
    );

    expect(mailer).toBeInstanceOf(ResendMailer);
  });

  it("selects the local inbox when the mailpit driver is configured", () => {
    const mailer = createMailer(
      parseEmailWorkerEnvironment({
        ...base,
        EMAIL_DRIVER: "mailpit",
        MAILPIT_BASE_URL: "http://mailpit:8025",
      }),
    );

    expect(mailer).toBeInstanceOf(MailpitMailer);
  });

  it("refuses the local inbox in production", () => {
    expect(() =>
      parseEmailWorkerEnvironment({
        ...base,
        NODE_ENV: "production",
        EMAIL_DRIVER: "mailpit",
        MAILPIT_BASE_URL: "http://mailpit:8025",
      }),
    ).toThrow(/must be resend in production/);
  });

  it("requires the inbox address when the mailpit driver is selected", () => {
    expect(() =>
      parseEmailWorkerEnvironment({ ...base, EMAIL_DRIVER: "mailpit" }),
    ).toThrow(/MAILPIT_BASE_URL is required/);
  });

  it("requires the provider key when the resend driver is selected", () => {
    expect(() => parseEmailWorkerEnvironment(base)).toThrow(
      /RESEND_API_KEY is required/,
    );
  });
});
