import type { MailerPort } from "../mailer.types";
import { createEmailDeliveryWorker } from "./create-email-delivery-worker";

let worker: MailerPort | undefined;

export function getEmailDeliveryWorker(): MailerPort {
  worker ??= createEmailDeliveryWorker(process.env);
  return worker;
}
