import {
  EMAIL_DELIVERY_CLAIMED,
  EMAIL_DELIVERY_NOT_READY,
  EMAIL_DELIVERY_TERMINAL,
  type ClaimEmailDeliveryInput,
  type ClaimEmailDeliveryResult,
  type CompleteEmailDeliveryInput,
  type FailEmailDeliveryInput,
  type ReleaseEmailDeliveryInput,
} from "@studiocar/email";

import type { PrismaClient } from "../../generated/prisma/client";
import { EmailDeliveryStatus } from "../../generated/prisma/client";

export class PrismaEmailDeliveryRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async claimDelivery(
    command: ClaimEmailDeliveryInput,
  ): Promise<ClaimEmailDeliveryResult> {
    const claimed = await this.database.emailOutboxMessage.updateMany({
      where: {
        id: command.messageId,
        publishedAt: { not: null },
        OR: [
          { status: EmailDeliveryStatus.QUEUED },
          {
            status: EmailDeliveryStatus.PROCESSING,
            deliveryClaimExpiresAt: { lte: command.now },
          },
        ],
      },
      data: {
        deliveryAttemptCount: { increment: 1 },
        deliveryClaimedAt: command.now,
        deliveryClaimExpiresAt: command.claimExpiresAt,
        deliveryClaimToken: command.claimToken,
        status: EmailDeliveryStatus.PROCESSING,
      },
    });
    if (claimed.count === 1) {
      const message = await this.database.emailOutboxMessage.findFirst({
        where: {
          id: command.messageId,
          deliveryClaimToken: command.claimToken,
          status: EmailDeliveryStatus.PROCESSING,
        },
        select: {
          id: true,
          recipient: true,
          vehicleId: true,
          vehicleName: true,
        },
      });
      return message
        ? { kind: EMAIL_DELIVERY_CLAIMED, message }
        : { kind: EMAIL_DELIVERY_NOT_READY };
    }

    const current = await this.database.emailOutboxMessage.findUnique({
      where: { id: command.messageId },
      select: { status: true },
    });
    return current?.status === EmailDeliveryStatus.DELIVERED ||
      current?.status === EmailDeliveryStatus.FAILED
      ? { kind: EMAIL_DELIVERY_TERMINAL }
      : { kind: EMAIL_DELIVERY_NOT_READY };
  }

  public async completeDelivery(
    command: CompleteEmailDeliveryInput,
  ): Promise<boolean> {
    const completed = await this.database.emailOutboxMessage.updateMany({
      where: {
        id: command.messageId,
        deliveryClaimToken: command.claimToken,
        status: EmailDeliveryStatus.PROCESSING,
      },
      data: {
        deliveredAt: command.deliveredAt,
        deliveryClaimedAt: null,
        deliveryClaimExpiresAt: null,
        deliveryClaimToken: null,
        lastErrorCode: null,
        providerMessageId: command.providerMessageId,
        status: EmailDeliveryStatus.DELIVERED,
      },
    });
    return completed.count === 1;
  }

  public async failDelivery(command: FailEmailDeliveryInput): Promise<boolean> {
    const failed = await this.database.emailOutboxMessage.updateMany({
      where: {
        id: command.messageId,
        deliveryClaimToken: command.claimToken,
        status: EmailDeliveryStatus.PROCESSING,
      },
      data: {
        deliveryClaimedAt: null,
        deliveryClaimExpiresAt: null,
        deliveryClaimToken: null,
        failedAt: command.failedAt,
        lastErrorCode: command.errorCode,
        status: EmailDeliveryStatus.FAILED,
      },
    });
    return failed.count === 1;
  }

  public async releaseDelivery(
    command: ReleaseEmailDeliveryInput,
  ): Promise<boolean> {
    const released = await this.database.emailOutboxMessage.updateMany({
      where: {
        id: command.messageId,
        deliveryClaimToken: command.claimToken,
        status: EmailDeliveryStatus.PROCESSING,
      },
      data: {
        deliveryClaimedAt: null,
        deliveryClaimExpiresAt: null,
        deliveryClaimToken: null,
        lastErrorCode: command.errorCode,
        status: EmailDeliveryStatus.QUEUED,
      },
    });
    return released.count === 1;
  }
}
