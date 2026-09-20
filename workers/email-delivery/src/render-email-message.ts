import type { EmailWorkerMessage } from "@studiocar/contracts";

import {
  EMAIL_PROCESSING_COMPLETE_ACTION,
  EMAIL_PROCESSING_COMPLETE_FOOTER,
  EMAIL_PROCESSING_COMPLETE_INTRO,
  EMAIL_PROCESSING_COMPLETE_SUBJECT,
} from "./email-delivery.constants";
import { escapeEmailHtml } from "./escape-email-html";
import type { MailRequest } from "./mailer.types";

export function renderEmailMessage(message: EmailWorkerMessage): MailRequest {
  const vehicleName = escapeEmailHtml(message.data.vehicleName);
  const portfolioUrl = escapeEmailHtml(message.data.portfolioUrl);
  const text = `${EMAIL_PROCESSING_COMPLETE_INTRO} ${message.data.vehicleName}. ${EMAIL_PROCESSING_COMPLETE_ACTION}: ${message.data.portfolioUrl}. ${EMAIL_PROCESSING_COMPLETE_FOOTER}`;

  return {
    html: `<main><h1>${EMAIL_PROCESSING_COMPLETE_SUBJECT}</h1><p>${EMAIL_PROCESSING_COMPLETE_INTRO} <strong>${vehicleName}</strong>.</p><p><a href="${portfolioUrl}">${EMAIL_PROCESSING_COMPLETE_ACTION}</a></p><p>${EMAIL_PROCESSING_COMPLETE_FOOTER}</p></main>`,
    idempotencyKey: message.messageId,
    recipient: message.recipient,
    subject: EMAIL_PROCESSING_COMPLETE_SUBJECT,
    text,
  };
}
