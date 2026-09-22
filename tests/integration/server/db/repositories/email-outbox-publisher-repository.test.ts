import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaEmailOutboxPublisherRepository } from "../../../../../apps/web/src/server/db/repositories/email-outbox-publisher-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const OWNER_EMAIL = "email-publisher@integration.studiocar.test";
const CLAIM_NOW = new Date("2099-09-20T12:00:00.000Z");
const RETRY_AT = new Date("2100-09-20T12:00:00.000Z");

databaseDescribe("PrismaEmailOutboxPublisherRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaEmailOutboxPublisherRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaEmailOutboxPublisherRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({ where: { primaryEmail: OWNER_EMAIL } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("claims once, schedules a retry, and records queue publication", async () => {
    const owner = await database.user.create({
      data: { primaryEmail: OWNER_EMAIL },
    });
    const vehicle = await database.vehicle.create({
      data: { userId: owner.id, name: "Email publisher vehicle" },
    });
    const message = await database.emailOutboxMessage.create({
      data: {
        batchIdempotencyKey: "email-publisher-batch",
        recipient: OWNER_EMAIL,
        type: "PROCESSING_COMPLETED",
        userId: owner.id,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
      },
    });

    const competingClaims = await Promise.all([
      repository.claimPendingOutbox({
        claimExpiresAt: new Date("2099-09-20T12:01:00.000Z"),
        claimToken: "email-publish-claim-1",
        limit: 1,
        now: CLAIM_NOW,
      }),
      repository.claimPendingOutbox({
        claimExpiresAt: new Date("2099-09-20T12:01:00.000Z"),
        claimToken: "email-publish-claim-2",
        limit: 1,
        now: CLAIM_NOW,
      }),
    ]);
    const claimed = competingClaims.flat();
    expect(claimed).toHaveLength(1);
    const claim = claimed[0];
    if (!claim) throw new Error("Expected one email outbox claim.");
    expect(claim).toMatchObject({
      id: message.id,
      publishAttemptCount: 1,
      recipient: OWNER_EMAIL,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
    });
    const claimToken = competingClaims[0]?.length === 1
      ? "email-publish-claim-1"
      : "email-publish-claim-2";

    await expect(
      repository.releaseOutboxClaim({
        claimToken,
        errorCode: "EMAIL_QUEUE_PUBLISH_FAILED",
        messageId: message.id,
        nextAttemptAt: RETRY_AT,
      }),
    ).resolves.toBe(true);

    const retryClaim = await repository.claimPendingOutbox({
      claimExpiresAt: new Date("2100-09-20T12:01:00.000Z"),
      claimToken: "email-publish-retry-claim",
      limit: 1,
      now: RETRY_AT,
    });
    const retried = retryClaim[0];
    if (!retried) throw new Error("Expected the released email to become due.");
    await expect(
      repository.markOutboxPublished({
        claimToken: "email-publish-retry-claim",
        messageId: retried.id,
        publishedAt: RETRY_AT,
        queueMessageId: "sqs-email-integration-1",
      }),
    ).resolves.toBe(true);
    await expect(
      database.emailOutboxMessage.findUnique({
        where: { id: message.id },
        select: {
          publishAttemptCount: true,
          publishedAt: true,
          queueMessageId: true,
          status: true,
        },
      }),
    ).resolves.toEqual({
      publishAttemptCount: 2,
      publishedAt: RETRY_AT,
      queueMessageId: "sqs-email-integration-1",
      status: "QUEUED",
    });
  });
});
