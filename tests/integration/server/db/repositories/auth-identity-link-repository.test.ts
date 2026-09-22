import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaAuthIdentityLinkRepository } from "../../../../../apps/web/src/server/db/repositories/auth-identity-link-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const ownerEmail = "link-owner@integration.studiocar.test";
const otherEmail = "link-other@integration.studiocar.test";
const googleEmail = "link-google@integration.studiocar.test";
const phoneNumber = "+919876500011";
const linkedAt = new Date("2026-09-22T10:00:00.000Z");

databaseDescribe("PrismaAuthIdentityLinkRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaAuthIdentityLinkRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaAuthIdentityLinkRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: {
        OR: [
          { primaryEmail: { in: [ownerEmail, otherEmail, googleEmail] } },
          { primaryPhone: phoneNumber },
        ],
      },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("connects Google to a phone-first account and adopts the verified email", async () => {
    const owner = await database.user.create({
      data: { primaryPhone: phoneNumber },
    });

    await expect(
      repository.linkGoogle({
        userId: owner.id,
        providerSubject: "google-subject-link-1",
        email: googleEmail,
        displayName: "Linked Owner",
        linkedAt,
      }),
    ).resolves.toEqual({ status: "linked" });

    const after = await database.user.findUniqueOrThrow({
      where: { id: owner.id },
      select: { primaryEmail: true, displayName: true, authIdentities: true },
    });
    expect(after.primaryEmail).toBe(googleEmail);
    expect(after.displayName).toBe("Linked Owner");
    expect(after.authIdentities).toHaveLength(1);
  });

  it("reports an identity the same account already holds as already linked", async () => {
    const owner = await database.user.create({
      data: { primaryPhone: phoneNumber },
    });
    const command = {
      userId: owner.id,
      providerSubject: "google-subject-link-2",
      email: googleEmail,
      displayName: null,
      linkedAt,
    };
    await repository.linkGoogle(command);

    await expect(repository.linkGoogle(command)).resolves.toEqual({
      status: "already_linked",
    });
    expect(
      await database.authIdentity.count({ where: { userId: owner.id } }),
    ).toBe(1);
  });

  it("refuses a Google identity that belongs to another account, and transfers nothing", async () => {
    const [owner, other] = await Promise.all([
      database.user.create({ data: { primaryPhone: phoneNumber } }),
      database.user.create({ data: { primaryEmail: otherEmail } }),
    ]);
    await database.authIdentity.create({
      data: {
        userId: other.id,
        provider: "GOOGLE",
        providerSubject: "google-subject-owned",
        email: otherEmail,
        emailVerifiedAt: linkedAt,
      },
    });

    await expect(
      repository.linkGoogle({
        userId: owner.id,
        providerSubject: "google-subject-owned",
        email: otherEmail,
        displayName: null,
        linkedAt,
      }),
    ).resolves.toEqual({ status: "identity_taken" });

    const identity = await database.authIdentity.findFirstOrThrow({
      where: { providerSubject: "google-subject-owned" },
      select: { userId: true },
    });
    expect(identity.userId).toBe(other.id);
    expect(
      await database.authIdentity.count({ where: { userId: owner.id } }),
    ).toBe(0);
  });

  it("refuses a verified email another account already holds", async () => {
    const [owner] = await Promise.all([
      database.user.create({ data: { primaryPhone: phoneNumber } }),
      database.user.create({ data: { primaryEmail: googleEmail } }),
    ]);

    await expect(
      repository.linkGoogle({
        userId: owner.id,
        providerSubject: "google-subject-link-3",
        email: googleEmail,
        displayName: null,
        linkedAt,
      }),
    ).resolves.toEqual({ status: "contact_taken" });
    expect(
      await database.authIdentity.count({ where: { userId: owner.id } }),
    ).toBe(0);
  });

  it("connects a phone number to a Google-first account", async () => {
    const owner = await database.user.create({
      data: { primaryEmail: ownerEmail },
    });

    await expect(
      repository.linkPhone({ userId: owner.id, phoneNumber, linkedAt }),
    ).resolves.toEqual({ status: "linked" });

    const after = await database.user.findUniqueOrThrow({
      where: { id: owner.id },
      select: { primaryPhone: true },
    });
    expect(after.primaryPhone).toBe(phoneNumber);
  });

  it("refuses a phone identity that belongs to another account", async () => {
    const [owner, other] = await Promise.all([
      database.user.create({ data: { primaryEmail: ownerEmail } }),
      database.user.create({ data: { primaryEmail: otherEmail } }),
    ]);
    await database.authIdentity.create({
      data: {
        userId: other.id,
        provider: "PHONE",
        providerSubject: phoneNumber,
        phoneNumber,
      },
    });

    await expect(
      repository.linkPhone({ userId: owner.id, phoneNumber, linkedAt }),
    ).resolves.toEqual({ status: "identity_taken" });
    expect(
      await database.authIdentity.count({ where: { userId: owner.id } }),
    ).toBe(0);
  });

  it("creates one identity when the same link is attempted concurrently", async () => {
    const owner = await database.user.create({
      data: { primaryPhone: phoneNumber },
    });
    const command = {
      userId: owner.id,
      providerSubject: "google-subject-race",
      email: googleEmail,
      displayName: null,
      linkedAt,
    };

    const results = await Promise.all([
      repository.linkGoogle(command),
      repository.linkGoogle(command),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual(
      ["already_linked", "linked"].sort(),
    );
    expect(
      await database.authIdentity.count({ where: { userId: owner.id } }),
    ).toBe(1);
  });

  it("leaves business ownership on the same internal user after linking", async () => {
    const owner = await database.user.create({
      data: { primaryPhone: phoneNumber },
    });
    const vehicle = await database.vehicle.create({
      data: { userId: owner.id, name: "Owned before linking" },
    });

    await repository.linkGoogle({
      userId: owner.id,
      providerSubject: "google-subject-ownership",
      email: googleEmail,
      displayName: null,
      linkedAt,
    });

    const after = await database.vehicle.findUniqueOrThrow({
      where: { id: vehicle.id },
      select: { userId: true },
    });
    expect(after.userId).toBe(owner.id);
  });
});
