import { parseEmailWorkerEnvironment } from "@studiocar/config";

import { ResendMailer } from "../resend-mailer";
import type { MailerPort } from "../mailer.types";

export function createEmailDeliveryWorker(
  environment: Record<string, string | undefined>,
): MailerPort {
  const configuration = parseEmailWorkerEnvironment(environment);
  return new ResendMailer({
    apiKey: configuration.RESEND_API_KEY,
    from: configuration.EMAIL_FROM,
    timeoutMilliseconds: configuration.RESEND_TIMEOUT_MS,
  });
}
