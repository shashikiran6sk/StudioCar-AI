import { z } from "zod";

import {
  RESEND_AUTHORIZATION_SCHEME,
  RESEND_CONTENT_TYPE,
  RESEND_EMAIL_ENDPOINT,
  RESEND_IDEMPOTENCY_HEADER,
  RESEND_INVALID_RESPONSE,
  RESEND_NETWORK_ERROR,
} from "./email-delivery.constants";
import type { MailDeliveryResult, MailerPort, MailRequest } from "./mailer.types";
import { resendFailureIsRetryable } from "./resend-failure-is-retryable";

const ResendSuccessSchema = z.object({ id: z.string().trim().min(1) });
const ResendFailureSchema = z.object({ name: z.string().trim().min(1) });

export interface ResendMailerOptions {
  apiKey: string;
  from: string;
  timeoutMilliseconds: number;
}

export class ResendMailer implements MailerPort {
  public constructor(
    private readonly options: ResendMailerOptions,
    private readonly request: typeof fetch = fetch,
  ) {}

  public async send(mail: MailRequest): Promise<MailDeliveryResult> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => {
        controller.abort();
      },
      this.options.timeoutMilliseconds,
    );
    try {
      const response = await this.request(RESEND_EMAIL_ENDPOINT, {
        body: JSON.stringify({
          from: this.options.from,
          html: mail.html,
          subject: mail.subject,
          text: mail.text,
          to: [mail.recipient],
        }),
        headers: {
          Authorization: `${RESEND_AUTHORIZATION_SCHEME} ${this.options.apiKey}`,
          "Content-Type": RESEND_CONTENT_TYPE,
          [RESEND_IDEMPOTENCY_HEADER]: mail.idempotencyKey,
        },
        method: "POST",
        signal: controller.signal,
      });
      if (!response.ok) {
        const failure = ResendFailureSchema.safeParse(
          await response.json().catch(() => undefined),
        );
        return {
          errorCode: `RESEND_HTTP_${String(response.status)}`,
          kind: "FAILED",
          retryable: resendFailureIsRetryable(
            response.status,
            failure.success ? failure.data.name : undefined,
          ),
        };
      }
      const result = ResendSuccessSchema.safeParse(await response.json());
      return result.success
        ? { kind: "DELIVERED", providerMessageId: result.data.id }
        : { errorCode: RESEND_INVALID_RESPONSE, kind: "FAILED", retryable: true };
    } catch {
      return { errorCode: RESEND_NETWORK_ERROR, kind: "FAILED", retryable: true };
    } finally {
      clearTimeout(timeout);
    }
  }
}
