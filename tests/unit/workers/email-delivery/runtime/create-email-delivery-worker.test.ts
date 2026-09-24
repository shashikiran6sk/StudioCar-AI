import { describe, expect, it } from "vitest";

import { EmailDeliveryProcessor } from "../../../../../packages/email/src/email-delivery-processor";
import { createEmailDeliveryWorker } from "../../../../../workers/email-delivery/src/runtime/create-email-delivery-worker";

const ENVIRONMENT = {
  APP_ENV: "production",
  APPLICATION_BASE_URL: "https://app.studiocar.example",
  DATABASE_URL: "postgresql://studiocar:secret@db.studiocar.example:5432/studiocar",
  EMAIL_FROM: "mail@example.com",
  RESEND_API_KEY: "secret",
};

describe("createEmailDeliveryWorker", () => {
  it("fails closed without email secrets", () => {
    expect(() => createEmailDeliveryWorker({})).toThrow();
  });

  it("creates the Resend adapter from validated server configuration", () => {
    expect(createEmailDeliveryWorker(ENVIRONMENT)).toBeInstanceOf(
      EmailDeliveryProcessor,
    );
  });
});
