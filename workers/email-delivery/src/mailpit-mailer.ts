import type { EmailWorkerMessage } from "@studiocar/contracts";
import {
  MAIL_DELIVERY_DELIVERED,
  MAIL_DELIVERY_FAILED,
  type MailDeliveryResult,
  type MailerPort,
} from "@studiocar/email";
import { z } from "zod";

import {
  MAILPIT_CONTENT_TYPE,
  MAILPIT_INVALID_RESPONSE,
  MAILPIT_NETWORK_ERROR,
  MAILPIT_SEND_PATH,
} from "./email-delivery.constants";
import { renderEmailMessage } from "./render-email-message";

const MailpitSuccessSchema = z.object({ ID: z.string().trim().min(1) });

export interface MailpitMailerOptions {
  baseUrl: string;
  from: string;
  timeoutMilliseconds: number;
}

/**
 * Local development mailer. It delivers to a Mailpit inbox on this machine so
 * the asynchronous email plane can be exercised end to end without sending a
 * real message to a real person. Selected only by EMAIL_DRIVER=mailpit, which
 * environment validation refuses in production.
 */
export class MailpitMailer implements MailerPort {
  public constructor(
    private readonly options: MailpitMailerOptions,
    private readonly request: typeof fetch = fetch,
  ) {}

  public async send(message: EmailWorkerMessage): Promise<MailDeliveryResult> {
    const mail = renderEmailMessage(message);
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.options.timeoutMilliseconds);

    try {
      const response = await this.request(
        new URL(MAILPIT_SEND_PATH, this.options.baseUrl),
        {
          body: JSON.stringify({
            From: { Email: this.options.from },
            HTML: mail.html,
            Subject: mail.subject,
            Text: mail.text,
            To: [{ Email: mail.recipient }],
          }),
          headers: { "Content-Type": MAILPIT_CONTENT_TYPE },
          method: "POST",
          signal: controller.signal,
        },
      );

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return {
          kind: MAIL_DELIVERY_FAILED,
          errorCode: MAILPIT_INVALID_RESPONSE,
          retryable: response.status >= 500,
        };
      }

      const parsed = MailpitSuccessSchema.safeParse(payload);
      if (!response.ok || !parsed.success) {
        return {
          kind: MAIL_DELIVERY_FAILED,
          errorCode: MAILPIT_INVALID_RESPONSE,
          retryable: response.status >= 500,
        };
      }

      return {
        kind: MAIL_DELIVERY_DELIVERED,
        providerMessageId: parsed.data.ID,
      };
    } catch {
      return {
        kind: MAIL_DELIVERY_FAILED,
        errorCode: MAILPIT_NETWORK_ERROR,
        retryable: true,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
