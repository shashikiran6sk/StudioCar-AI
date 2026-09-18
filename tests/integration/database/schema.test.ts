import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../packages/database/src/client";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

databaseDescribe("PostgreSQL schema invariants", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  const identitySubject = "schema-test-google-subject";
  const webhookExternalId = "schema-test-webhook-event";

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for database integration tests.");
    }

    database = createDatabaseClient({
      connectionString: databaseUrl,
      log: [],
      poolSize: 2,
    });
  });

  afterEach(async () => {
    await database.webhookEvent.deleteMany({
      where: { externalId: webhookExternalId },
    });
    await database.user.deleteMany({
      where: {
        authIdentities: { some: { providerSubject: identitySubject } },
      },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("enforces identity idempotency and vehicle year constraints", async () => {
    const user = await database.user.create({
      data: {
        displayName: "Schema Test Dealer",
        authIdentities: {
          create: {
            provider: "GOOGLE",
            providerSubject: identitySubject,
          },
        },
      },
    });

    await expect(
      database.authIdentity.create({
        data: {
          userId: user.id,
          provider: "GOOGLE",
          providerSubject: identitySubject,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });

    await expect(
      database.vehicle.create({
        data: {
          userId: user.id,
          name: "Invalid vehicle year",
          year: 1800,
        },
      }),
    ).rejects.toThrow();
  });

  it("deduplicates provider webhooks by external ID", async () => {
    const event = {
      provider: "FAL",
      externalId: webhookExternalId,
      eventType: "job.completed",
      payload: { job: "provider-job-1" },
      signatureVerified: true,
    };

    await database.webhookEvent.create({ data: event });

    await expect(database.webhookEvent.create({ data: event })).rejects.toMatchObject({
      code: "P2002",
    });
  });
});
