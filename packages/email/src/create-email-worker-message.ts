import {
  EmailWorkerMessageSchema,
  type EmailWorkerMessage,
} from "@studiocar/contracts";

import { EMAIL_MESSAGE_TYPE, EMAIL_MESSAGE_VERSION } from "./email.constants";
import type { EmailMessageSnapshot } from "./email.types";

const VEHICLE_PORTFOLIO_PATH_PREFIX = "/inventory/";

export function createEmailWorkerMessage(
  snapshot: EmailMessageSnapshot,
  applicationBaseUrl: string,
): EmailWorkerMessage {
  const portfolioUrl = new URL(
    `${VEHICLE_PORTFOLIO_PATH_PREFIX}${encodeURIComponent(snapshot.vehicleId)}`,
    applicationBaseUrl,
  ).toString();

  return EmailWorkerMessageSchema.parse({
    data: {
      portfolioUrl,
      vehicleName: snapshot.vehicleName,
    },
    messageId: snapshot.id,
    recipient: snapshot.recipient,
    type: EMAIL_MESSAGE_TYPE,
    version: EMAIL_MESSAGE_VERSION,
  });
}
