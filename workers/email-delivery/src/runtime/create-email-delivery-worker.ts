import { parseEmailWorkerEnvironment } from "@studiocar/config";
import {
  createDatabaseClient,
  PrismaEmailDeliveryRepository,
} from "@studiocar/database";
import { EmailDeliveryProcessor } from "@studiocar/email";

import { ResendMailer } from "../resend-mailer";

export function createEmailDeliveryWorker(
  environment: Record<string, string | undefined>,
): EmailDeliveryProcessor {
  const configuration = parseEmailWorkerEnvironment(environment);
  const database = createDatabaseClient({
    connectionString: configuration.DATABASE_URL,
    poolSize: 2,
  });
  return new EmailDeliveryProcessor(
    new PrismaEmailDeliveryRepository(database),
    new ResendMailer({
      apiKey: configuration.RESEND_API_KEY,
      from: configuration.EMAIL_FROM,
      timeoutMilliseconds: configuration.RESEND_TIMEOUT_MS,
    }),
    {
      applicationBaseUrl: configuration.APPLICATION_BASE_URL,
      claimTtlMilliseconds: configuration.EMAIL_DELIVERY_CLAIM_TTL_MS,
    },
  );
}
