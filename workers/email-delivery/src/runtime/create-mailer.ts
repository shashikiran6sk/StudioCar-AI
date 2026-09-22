import type { EmailWorkerEnvironment } from "@studiocar/config";
import type { MailerPort } from "@studiocar/email";

import { MailpitMailer } from "../mailpit-mailer";
import { ResendMailer } from "../resend-mailer";

const MISSING_MAILPIT_BASE_URL_ERROR =
  "MAILPIT_BASE_URL is required when EMAIL_DRIVER is mailpit.";
const MISSING_RESEND_API_KEY_ERROR =
  "RESEND_API_KEY is required when EMAIL_DRIVER is resend.";

export function createMailer(
  configuration: EmailWorkerEnvironment,
): MailerPort {
  if (configuration.EMAIL_DRIVER === "mailpit") {
    const baseUrl = configuration.MAILPIT_BASE_URL;
    if (!baseUrl) throw new Error(MISSING_MAILPIT_BASE_URL_ERROR);
    return new MailpitMailer({
      baseUrl,
      from: configuration.EMAIL_FROM,
      timeoutMilliseconds: configuration.RESEND_TIMEOUT_MS,
    });
  }

  const apiKey = configuration.RESEND_API_KEY;
  if (!apiKey) throw new Error(MISSING_RESEND_API_KEY_ERROR);
  return new ResendMailer({
    apiKey,
    from: configuration.EMAIL_FROM,
    timeoutMilliseconds: configuration.RESEND_TIMEOUT_MS,
  });
}
