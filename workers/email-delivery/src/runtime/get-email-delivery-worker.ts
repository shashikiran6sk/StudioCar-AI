import type { EmailDeliveryProcessor } from "@studiocar/email";
import { createEmailDeliveryWorker } from "./create-email-delivery-worker";

let worker: EmailDeliveryProcessor | undefined;

export function getEmailDeliveryWorker(): EmailDeliveryProcessor {
  worker ??= createEmailDeliveryWorker(process.env);
  return worker;
}
