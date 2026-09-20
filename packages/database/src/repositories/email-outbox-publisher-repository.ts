import type {
  ClaimEmailOutboxInput,
  EmailOutboxMessage,
  MarkEmailOutboxPublishedInput,
  ReleaseEmailOutboxInput,
} from "@studiocar/email";

import type { PrismaClient } from "../../generated/prisma/client";
import {
  EmailDeliveryStatus,
  type Prisma,
} from "../../generated/prisma/client";

const emailOutboxSelect = {
  createdAt: true,
  id: true,
  publishAttemptCount: true,
  recipient: true,
  vehicleId: true,
  vehicleName: true,
} satisfies Prisma.EmailOutboxMessageSelect;

const MINIMUM_CLAIM_LIMIT = 1;
const MAXIMUM_CLAIM_LIMIT = 100;

export class PrismaEmailOutboxPublisherRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async claimPendingOutbox(
    command: ClaimEmailOutboxInput,
  ): Promise<EmailOutboxMessage[]> {
    if (
      !Number.isInteger(command.limit) ||
      command.limit < MINIMUM_CLAIM_LIMIT ||
      command.limit > MAXIMUM_CLAIM_LIMIT
    ) {
      throw new RangeError(
        `Email outbox claim limit must be between ${String(MINIMUM_CLAIM_LIMIT)} and ${String(MAXIMUM_CLAIM_LIMIT)}.`,
      );
    }

    const candidates = await this.database.emailOutboxMessage.findMany({
      where: {
        publishedAt: null,
        publishNextAttemptAt: { lte: command.now },
        status: EmailDeliveryStatus.PENDING,
        OR: [
          { publishClaimExpiresAt: null },
          { publishClaimExpiresAt: { lte: command.now } },
        ],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: command.limit,
      select: { id: true },
    });
    const claimed: EmailOutboxMessage[] = [];

    for (const candidate of candidates) {
      const result = await this.database.emailOutboxMessage.updateMany({
        where: {
          id: candidate.id,
          publishedAt: null,
          publishNextAttemptAt: { lte: command.now },
          status: EmailDeliveryStatus.PENDING,
          OR: [
            { publishClaimExpiresAt: null },
            { publishClaimExpiresAt: { lte: command.now } },
          ],
        },
        data: {
          publishAttemptCount: { increment: 1 },
          publishClaimedAt: command.now,
          publishClaimExpiresAt: command.claimExpiresAt,
          publishClaimToken: command.claimToken,
        },
      });
      if (result.count !== 1) continue;

      const message = await this.database.emailOutboxMessage.findUnique({
        where: { id: candidate.id },
        select: emailOutboxSelect,
      });
      if (message) claimed.push(message);
    }
    return claimed;
  }

  public async markOutboxPublished(
    command: MarkEmailOutboxPublishedInput,
  ): Promise<boolean> {
    const published = await this.database.emailOutboxMessage.updateMany({
      where: {
        id: command.messageId,
        publishClaimToken: command.claimToken,
        publishedAt: null,
        status: EmailDeliveryStatus.PENDING,
      },
      data: {
        lastErrorCode: null,
        publishClaimedAt: null,
        publishClaimExpiresAt: null,
        publishClaimToken: null,
        publishedAt: command.publishedAt,
        queueMessageId: command.queueMessageId,
        status: EmailDeliveryStatus.QUEUED,
      },
    });
    return published.count === 1;
  }

  public async releaseOutboxClaim(
    command: ReleaseEmailOutboxInput,
  ): Promise<boolean> {
    const released = await this.database.emailOutboxMessage.updateMany({
      where: {
        id: command.messageId,
        publishClaimToken: command.claimToken,
        publishedAt: null,
        status: EmailDeliveryStatus.PENDING,
      },
      data: {
        lastErrorCode: command.errorCode,
        publishClaimedAt: null,
        publishClaimExpiresAt: null,
        publishClaimToken: null,
        publishNextAttemptAt: command.nextAttemptAt,
      },
    });
    return released.count === 1;
  }
}
