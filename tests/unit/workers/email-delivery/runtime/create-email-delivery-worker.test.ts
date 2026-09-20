import { describe, expect, it } from "vitest";

import { ResendMailer } from "../../../../../workers/email-delivery/src/resend-mailer";
import { createEmailDeliveryWorker } from "../../../../../workers/email-delivery/src/runtime/create-email-delivery-worker";

describe("createEmailDeliveryWorker", () => {
  it("fails closed without email secrets", () => {
    expect(() => createEmailDeliveryWorker({})).toThrow();
  });

  it("creates the Resend adapter from validated server configuration", () => {
    expect(
      createEmailDeliveryWorker({
        EMAIL_FROM: "mail@example.com",
        RESEND_API_KEY: "secret",
      }),
    ).toBeInstanceOf(ResendMailer);
  });
});
