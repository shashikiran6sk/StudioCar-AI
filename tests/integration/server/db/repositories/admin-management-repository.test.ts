import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaAdminManagementRepository } from "../../../../../apps/web/src/server/db/repositories/admin-management-repository";
import { PrismaAdminRoleRepository } from "../../../../../apps/web/src/server/db/repositories/admin-role-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

const actorEmail = "manage-actor@integration.studiocar.test";
const targetEmail = "manage-target@integration.studiocar.test";
const phoneOnlyEmail = "manage-phone@integration.studiocar.test";
const unknownEmail = "manage-unknown@integration.studiocar.test";
const now = new Date("2026-09-22T10:00:00.000Z");
const expiresAt = new Date("2026-09-29T10:00:00.000Z");

databaseDescribe("PrismaAdminManagementRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaAdminManagementRepository;
  let roles: PrismaAdminRoleRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaAdminManagementRepository(database);
    roles = new PrismaAdminRoleRepository(database);
  });

  afterEach(async () => {
    await database.adminInvite.deleteMany({
      where: { email: { in: [targetEmail, phoneOnlyEmail, unknownEmail] } },
    });
    await database.auditLog.deleteMany({
      where: { resourceType: { in: ["UserRole", "AdminInvite"] } },
    });
    await database.user.deleteMany({
      where: {
        primaryEmail: { in: [actorEmail, targetEmail, phoneOnlyEmail] },
      },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  /** An administrator who can perform the action under test. */
  async function createActor() {
    const actor = await database.user.create({
      data: { primaryEmail: actorEmail, displayName: "Acting Admin" },
    });
    await database.userRole.create({
      data: { userId: actor.id, role: "ADMIN", source: "BOOTSTRAP" },
    });
    return actor;
  }

  async function createVerifiedGoogleUser(email: string) {
    const user = await database.user.create({ data: { primaryEmail: email } });
    await database.authIdentity.create({
      data: {
        userId: user.id,
        provider: "GOOGLE",
        providerSubject: `google-${email}`,
        email,
        emailVerifiedAt: now,
      },
    });
    return user;
  }

  it("grants at once when a verified Google identity holds the address", async () => {
    const actor = await createActor();
    const target = await createVerifiedGoogleUser(targetEmail);

    await expect(
      repository.grantOrInvite({
        email: targetEmail,
        actorUserId: actor.id,
        now,
        expiresAt,
      }),
    ).resolves.toEqual({ kind: "GRANTED", userId: target.id });
    await expect(roles.isAdministrator(target.id)).resolves.toBe(true);

    const audit = await database.auditLog.findFirstOrThrow({
      where: { resourceId: target.id, action: "ADMIN_GRANTED" },
      select: { userId: true },
    });
    expect(audit.userId).toBe(actor.id);
  });

  it("invites instead of granting when nobody holds the address", async () => {
    const actor = await createActor();

    const result = await repository.grantOrInvite({
      email: unknownEmail,
      actorUserId: actor.id,
      now,
      expiresAt,
    });

    expect(result.kind).toBe("INVITED");
    // No placeholder account is created for an invited address.
    await expect(
      database.user.findFirst({ where: { primaryEmail: unknownEmail } }),
    ).resolves.toBeNull();
  });

  it("never grants from a phone-only account's profile email", async () => {
    const actor = await createActor();
    const phoneOnly = await database.user.create({
      data: { primaryEmail: phoneOnlyEmail, primaryPhone: "+919876500077" },
    });
    await database.authIdentity.create({
      data: {
        userId: phoneOnly.id,
        provider: "PHONE",
        providerSubject: "+919876500077",
        phoneNumber: "+919876500077",
      },
    });

    const result = await repository.grantOrInvite({
      email: phoneOnlyEmail,
      actorUserId: actor.id,
      now,
      expiresAt,
    });

    // The address is on the profile, but Google never verified it.
    expect(result.kind).toBe("INVITED");
    await expect(roles.isAdministrator(phoneOnly.id)).resolves.toBe(false);
  });

  it("refuses a duplicate invitation for the same address", async () => {
    const actor = await createActor();
    await repository.grantOrInvite({
      email: unknownEmail,
      actorUserId: actor.id,
      now,
      expiresAt,
    });

    await expect(
      repository.grantOrInvite({
        email: unknownEmail,
        actorUserId: actor.id,
        now,
        expiresAt,
      }),
    ).resolves.toEqual({ kind: "ALREADY_INVITED" });
    expect(
      await database.adminInvite.count({ where: { email: unknownEmail } }),
    ).toBe(1);
  });

  it("reports an account that already holds the role", async () => {
    const actor = await createActor();
    const target = await createVerifiedGoogleUser(targetEmail);
    await repository.grantOrInvite({
      email: targetEmail,
      actorUserId: actor.id,
      now,
      expiresAt,
    });

    await expect(
      repository.grantOrInvite({
        email: targetEmail,
        actorUserId: actor.id,
        now,
        expiresAt,
      }),
    ).resolves.toEqual({ kind: "ALREADY_ADMINISTRATOR", userId: target.id });
    expect(
      await database.userRole.count({ where: { userId: target.id } }),
    ).toBe(1);
  });

  it("activates an invitation only on a verified sign-in", async () => {
    const actor = await createActor();
    await repository.grantOrInvite({
      email: targetEmail,
      actorUserId: actor.id,
      now,
      expiresAt,
    });

    const target = await createVerifiedGoogleUser(targetEmail);
    await expect(
      repository.acceptForVerifiedEmail({
        userId: target.id,
        email: targetEmail,
        now,
      }),
    ).resolves.toBe(true);

    await expect(roles.isAdministrator(target.id)).resolves.toBe(true);
    const invite = await database.adminInvite.findFirstOrThrow({
      where: { email: targetEmail },
      select: { status: true, acceptedByUserId: true },
    });
    expect(invite).toEqual({
      status: "ACCEPTED",
      acceptedByUserId: target.id,
    });
  });

  it("closes an expired invitation rather than honouring it", async () => {
    const actor = await createActor();
    await repository.grantOrInvite({
      email: targetEmail,
      actorUserId: actor.id,
      now,
      expiresAt: new Date("2026-09-21T10:00:00.000Z"),
    });
    const target = await createVerifiedGoogleUser(targetEmail);

    await expect(
      repository.acceptForVerifiedEmail({
        userId: target.id,
        email: targetEmail,
        now,
      }),
    ).resolves.toBe(false);

    await expect(roles.isAdministrator(target.id)).resolves.toBe(false);
    const invite = await database.adminInvite.findFirstOrThrow({
      where: { email: targetEmail },
      select: { status: true },
    });
    expect(invite.status).toBe("EXPIRED");
  });

  it("does not activate a revoked invitation", async () => {
    const actor = await createActor();
    const invited = await repository.grantOrInvite({
      email: targetEmail,
      actorUserId: actor.id,
      now,
      expiresAt,
    });
    if (invited.kind !== "INVITED") throw new Error("Expected an invitation.");
    await repository.revokeInvite({
      inviteId: invited.inviteId,
      actorUserId: actor.id,
    });
    const target = await createVerifiedGoogleUser(targetEmail);

    await expect(
      repository.acceptForVerifiedEmail({
        userId: target.id,
        email: targetEmail,
        now,
      }),
    ).resolves.toBe(false);
    await expect(roles.isAdministrator(target.id)).resolves.toBe(false);
  });

  it("revokes an administrator while another remains", async () => {
    const actor = await createActor();
    const target = await createVerifiedGoogleUser(targetEmail);
    await repository.grantOrInvite({
      email: targetEmail,
      actorUserId: actor.id,
      now,
      expiresAt,
    });

    await expect(
      repository.revoke({ userId: target.id, actorUserId: actor.id }),
    ).resolves.toEqual({ kind: "REVOKED" });
    await expect(roles.isAdministrator(target.id)).resolves.toBe(false);
    await expect(roles.isAdministrator(actor.id)).resolves.toBe(true);
  });

  it("never lets StudioCar AI reach zero administrators", async () => {
    const actor = await createActor();
    const before = await roles.countAdministrators();

    await expect(
      repository.revoke({ userId: actor.id, actorUserId: actor.id }),
    ).resolves.toEqual({ kind: "LAST_ADMINISTRATOR" });
    await expect(roles.isAdministrator(actor.id)).resolves.toBe(true);
    await expect(roles.countAdministrators()).resolves.toBe(before);
  });

  it("leaves one administrator when two revoke each other at once", async () => {
    const actor = await createActor();
    const target = await createVerifiedGoogleUser(targetEmail);
    await repository.grantOrInvite({
      email: targetEmail,
      actorUserId: actor.id,
      now,
      expiresAt,
    });

    await Promise.all([
      repository.revoke({ userId: target.id, actorUserId: actor.id }),
      repository.revoke({ userId: actor.id, actorUserId: target.id }),
    ]);

    await expect(roles.countAdministrators()).resolves.toBe(1);
  });

  it("reports an account that holds no role", async () => {
    const actor = await createActor();
    const target = await createVerifiedGoogleUser(targetEmail);

    await expect(
      repository.revoke({ userId: target.id, actorUserId: actor.id }),
    ).resolves.toEqual({ kind: "NOT_ADMINISTRATOR" });
  });

  it("lists pending invitations with who sent them", async () => {
    const actor = await createActor();
    await repository.grantOrInvite({
      email: unknownEmail,
      actorUserId: actor.id,
      now,
      expiresAt,
    });

    const pending = await repository.listPendingInvites();
    expect(pending).toContainEqual(
      expect.objectContaining({
        email: unknownEmail,
        invitedByName: "Acting Admin",
      }),
    );
  });
});
