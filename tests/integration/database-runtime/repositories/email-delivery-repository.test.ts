import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { PrismaEmailDeliveryRepository } from "../../../../packages/database-runtime/src/repositories/email-delivery-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const OWNER_EMAIL = "email-delivery@integration.studiocar.test";
const CLAIM_NOW = new Date("2099-09-20T12:00:00.000Z");
const CLAIM_EXPIRES_AT = new Date("2099-09-20T12:01:00.000Z");

databaseDescribe("PrismaEmailDeliveryRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaEmailDeliveryRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaEmailDeliveryRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({ where: { primaryEmail: OWNER_EMAIL } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("claims once and makes delivered messages terminal for duplicate queues", async () => {
    const owner = await database.user.create({
      data: { primaryEmail: OWNER_EMAIL },
    });
    const vehicle = await database.vehicle.create({
      data: { userId: owner.id, name: "Email delivery vehicle" },
    });
    const message = await database.emailOutboxMessage.create({
      data: {
        batchIdempotencyKey: "email-delivery-batch",
        publishedAt: CLAIM_NOW,
        queueMessageId: "sqs-email-delivery-1",
        recipient: OWNER_EMAIL,
        status: "QUEUED",
        type: "PROCESSING_COMPLETED",
        userId: owner.id,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
      },
    });

    const competingClaims = await Promise.all([
      repository.claimDelivery({
        claimExpiresAt: CLAIM_EXPIRES_AT,
        claimToken: "email-delivery-claim-1",
        messageId: message.id,
        now: CLAIM_NOW,
      }),
      repository.claimDelivery({
        claimExpiresAt: CLAIM_EXPIRES_AT,
        claimToken: "email-delivery-claim-2",
        messageId: message.id,
        now: CLAIM_NOW,
      }),
    ]);
    const ownedClaim = competingClaims.find((claim) => claim.kind === "CLAIMED");
    expect(ownedClaim).toEqual({
      kind: "CLAIMED",
      message: {
        id: message.id,
        recipient: OWNER_EMAIL,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
      },
    });
    const claimToken = competingClaims[0]?.kind === "CLAIMED"
      ? "email-delivery-claim-1"
      : "email-delivery-claim-2";

    await expect(
      repository.completeDelivery({
        claimToken,
        deliveredAt: CLAIM_NOW,
        messageId: message.id,
        providerMessageId: "resend-message-1",
      }),
    ).resolves.toBe(true);
    await expect(
      repository.claimDelivery({
        claimExpiresAt: CLAIM_EXPIRES_AT,
        claimToken: "email-delivery-duplicate",
        messageId: message.id,
        now: CLAIM_NOW,
      }),
    ).resolves.toEqual({ kind: "TERMINAL" });
    await expect(
      database.emailOutboxMessage.findUnique({
        where: { id: message.id },
        select: {
          deliveredAt: true,
          deliveryAttemptCount: true,
          providerMessageId: true,
          status: true,
        },
      }),
    ).resolves.toEqual({
      deliveredAt: CLAIM_NOW,
      deliveryAttemptCount: 1,
      providerMessageId: "resend-message-1",
      status: "DELIVERED",
    });
  });

  it("releases transient failures and persists terminal failures", async () => {
    const owner = await database.user.create({
      data: { primaryEmail: OWNER_EMAIL },
    });
    const vehicle = await database.vehicle.create({
      data: { userId: owner.id, name: "Retry delivery vehicle" },
    });
    const message = await database.emailOutboxMessage.create({
      data: {
        batchIdempotencyKey: "email-retry-batch",
        publishedAt: CLAIM_NOW,
        recipient: OWNER_EMAIL,
        status: "QUEUED",
        type: "PROCESSING_COMPLETED",
        userId: owner.id,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
      },
    });
    await repository.claimDelivery({
      claimExpiresAt: CLAIM_EXPIRES_AT,
      claimToken: "email-retry-claim",
      messageId: message.id,
      now: CLAIM_NOW,
    });
    await expect(
      repository.releaseDelivery({
        claimToken: "email-retry-claim",
        errorCode: "RESEND_HTTP_429",
        messageId: message.id,
      }),
    ).resolves.toBe(true);
    await expect(
      repository.claimDelivery({
        claimExpiresAt: CLAIM_EXPIRES_AT,
        claimToken: "email-terminal-claim",
        messageId: message.id,
        now: CLAIM_NOW,
      }),
    ).resolves.toMatchObject({ kind: "CLAIMED" });
    await expect(
      repository.failDelivery({
        claimToken: "email-terminal-claim",
        errorCode: "RESEND_HTTP_400",
        failedAt: CLAIM_NOW,
        messageId: message.id,
      }),
    ).resolves.toBe(true);
    await expect(
      database.emailOutboxMessage.findUnique({
        where: { id: message.id },
        select: {
          deliveryAttemptCount: true,
          failedAt: true,
          lastErrorCode: true,
          status: true,
        },
      }),
    ).resolves.toEqual({
      deliveryAttemptCount: 2,
      failedAt: CLAIM_NOW,
      lastErrorCode: "RESEND_HTTP_400",
      status: "FAILED",
    });
  });
});
