import { parseEmailWorkerEnvironment } from "@studiocar/config";
import {
  createDatabaseClient,
  PrismaEmailDeliveryRepository,
} from "@studiocar/database-runtime";
import { EmailDeliveryProcessor } from "@studiocar/email";

import { createMailer } from "./create-mailer";

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
    createMailer(configuration),
    {
      applicationBaseUrl: configuration.APPLICATION_BASE_URL,
      claimTtlMilliseconds: configuration.EMAIL_DELIVERY_CLAIM_TTL_MS,
    },
  );
}
