import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import type { ManualSubscriptionPlanKey } from "../../../../../packages/contracts/src/subscriptions";
import { PrismaManualSubscriptionRepository } from "../../../../../apps/web/src/server/db/repositories/manual-subscription-repository";
import { PrismaUsageBillingRepository } from "../../../../../apps/web/src/server/db/repositories/usage-billing-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

const adminEmail = "subscription-admin@integration.studiocar.test";
const ownerEmail = "subscription-owner@integration.studiocar.test";
const otherEmail = "subscription-other@integration.studiocar.test";
const ownerPhone = "+919876500123";
const emails = [adminEmail, ownerEmail, otherEmail];

const now = new Date("2026-09-22T10:00:00.000Z");
const periodEnd = new Date("2026-12-22T10:00:00.000Z");

databaseDescribe("PrismaManualSubscriptionRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaManualSubscriptionRepository;
  let billing: PrismaUsageBillingRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaManualSubscriptionRepository(database);
    billing = new PrismaUsageBillingRepository(database);
  });

  afterEach(async () => {
    await database.auditLog.deleteMany({
      where: { resourceType: "PlanSubscription" },
    });
    await database.user.deleteMany({
      where: { primaryEmail: { in: emails } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  async function createAdmin() {
    return database.user.create({
      data: { primaryEmail: adminEmail, displayName: "Ops Lead" },
    });
  }

  /** An account that signed in with Google, so its email is verified. */
  async function createGoogleAccount(email: string) {
    const user = await database.user.create({
      data: { primaryEmail: email, displayName: "Account Owner" },
    });
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

  function assignment(
    userId: string,
    planKey: ManualSubscriptionPlanKey = "STUDIO_PRO",
  ) {
    return { months: 3, planKey, userId };
  }

  describe("finding an account", () => {
    it("finds an account by an email Google verified", async () => {
      const owner = await createGoogleAccount(ownerEmail);

      await expect(
        repository.findAccountByVerifiedContact({ email: ownerEmail }),
      ).resolves.toMatchObject({ userId: owner.id, email: ownerEmail });
    });

    it("finds an account by the number it signs in with", async () => {
      const owner = await database.user.create({
        data: { primaryEmail: ownerEmail, primaryPhone: ownerPhone },
      });
      await database.authIdentity.create({
        data: {
          userId: owner.id,
          provider: "PHONE",
          providerSubject: ownerPhone,
          phoneNumber: ownerPhone,
        },
      });

      await expect(
        repository.findAccountByVerifiedContact({ phoneNumber: ownerPhone }),
      ).resolves.toMatchObject({ userId: owner.id });
    });

    it("never finds an account by an address only its profile carries", async () => {
      // The value is on the profile, but nothing ever verified it.
      await database.user.create({ data: { primaryEmail: ownerEmail } });

      await expect(
        repository.findAccountByVerifiedContact({ email: ownerEmail }),
      ).resolves.toBeNull();
    });

    it("never finds an account by an unverified Google identity", async () => {
      const owner = await database.user.create({
        data: { primaryEmail: ownerEmail },
      });
      await database.authIdentity.create({
        data: {
          userId: owner.id,
          provider: "GOOGLE",
          providerSubject: `google-${ownerEmail}`,
          email: ownerEmail,
          emailVerifiedAt: null,
        },
      });

      await expect(
        repository.findAccountByVerifiedContact({ email: ownerEmail }),
      ).resolves.toBeNull();
    });
  });

  describe("assigning a plan", () => {
    it("assigns a plan and records who did it and why", async () => {
      const [admin, owner] = await Promise.all([
        createAdmin(),
        createGoogleAccount(ownerEmail),
      ]);

      await expect(
        repository.assign({
          actorUserId: admin.id,
          assignment: { ...assignment(owner.id), note: "Pilot migration." },
          now,
          periodEnd,
        }),
      ).resolves.toEqual({ kind: "ASSIGNED" });

      // The read path the whole product uses now resolves the new plan.
      await expect(billing.findOwnedPlanKey(owner.id, now)).resolves.toBe(
        "STUDIO_PRO",
      );
      const audit = await database.auditLog.findFirstOrThrow({
        where: { resourceType: "PlanSubscription" },
        select: { action: true, userId: true },
      });
      expect(audit).toEqual({
        action: "SUBSCRIPTION_ASSIGNED",
        userId: admin.id,
      });
    });

    it("replaces an existing assignment rather than stacking a second", async () => {
      const [admin, owner] = await Promise.all([
        createAdmin(),
        createGoogleAccount(ownerEmail),
      ]);
      await repository.assign({
        actorUserId: admin.id,
        assignment: assignment(owner.id, "STUDIO_PRO"),
        now,
        periodEnd,
      });

      await expect(
        repository.assign({
          actorUserId: admin.id,
          assignment: assignment(owner.id, "STUDIO_PLUS"),
          now,
          periodEnd,
        }),
      ).resolves.toEqual({ kind: "REPLACED" });

      // Exactly one plan applies, so "which plan" is never ambiguous.
      await expect(billing.findOwnedPlanKey(owner.id, now)).resolves.toBe(
        "STUDIO_PLUS",
      );
      expect(
        await database.planSubscription.count({
          where: { userId: owner.id, status: "ACTIVE" },
        }),
      ).toBe(1);
    });

    it("replaces an expired assignment that is still marked active", async () => {
      const [admin, owner] = await Promise.all([
        createAdmin(),
        createGoogleAccount(ownerEmail),
      ]);
      await database.planSubscription.create({
        data: {
          userId: owner.id,
          source: "MANUAL_ADMIN",
          planKey: "STUDIO_PACK",
          status: "ACTIVE",
          currentPeriodStart: new Date("2026-01-01T00:00:00.000Z"),
          currentPeriodEnd: new Date("2026-02-01T00:00:00.000Z"),
        },
      });

      // The unique index counts it, so it must be closed or the insert fails.
      await expect(
        repository.assign({
          actorUserId: admin.id,
          assignment: assignment(owner.id),
          now,
          periodEnd,
        }),
      ).resolves.toEqual({ kind: "REPLACED" });
      await expect(billing.findOwnedPlanKey(owner.id, now)).resolves.toBe(
        "STUDIO_PRO",
      );
    });

    it("never overwrites a subscription a payment provider owns", async () => {
      const [admin, owner] = await Promise.all([
        createAdmin(),
        createGoogleAccount(ownerEmail),
      ]);
      await database.planSubscription.create({
        data: {
          userId: owner.id,
          source: "PAYMENT_PROVIDER",
          provider: "stripe",
          providerSubscriptionId: "sub_integration_owner",
          planKey: "STUDIO_PACK",
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      await expect(
        repository.assign({
          actorUserId: admin.id,
          assignment: assignment(owner.id),
          now,
          periodEnd,
        }),
      ).resolves.toEqual({ kind: "PROVIDER_MANAGED" });

      // The provider is the authority on what somebody has paid for.
      await expect(billing.findOwnedPlanKey(owner.id, now)).resolves.toBe(
        "STUDIO_PACK",
      );
      expect(
        await database.auditLog.count({
          where: { resourceType: "PlanSubscription" },
        }),
      ).toBe(0);
    });

    it("assigns over a provider subscription that has already ended", async () => {
      const [admin, owner] = await Promise.all([
        createAdmin(),
        createGoogleAccount(ownerEmail),
      ]);
      await database.planSubscription.create({
        data: {
          userId: owner.id,
          source: "PAYMENT_PROVIDER",
          provider: "stripe",
          providerSubscriptionId: "sub_integration_expired",
          planKey: "STUDIO_PACK",
          status: "EXPIRED",
          currentPeriodStart: new Date("2026-01-01T00:00:00.000Z"),
          currentPeriodEnd: new Date("2026-02-01T00:00:00.000Z"),
        },
      });

      await expect(
        repository.assign({
          actorUserId: admin.id,
          assignment: assignment(owner.id),
          now,
          periodEnd,
        }),
      ).resolves.toEqual({ kind: "ASSIGNED" });
    });

    it("refuses an account that does not exist", async () => {
      const admin = await createAdmin();

      await expect(
        repository.assign({
          actorUserId: admin.id,
          assignment: assignment("2b8f0ad2-1c37-4a0d-9b93-9b0e1a1f2c34"),
          now,
          periodEnd,
        }),
      ).resolves.toEqual({ kind: "UNKNOWN_ACCOUNT" });
    });

    it("leaves one assignment when two administrators act at once", async () => {
      const [admin, owner] = await Promise.all([
        createAdmin(),
        createGoogleAccount(ownerEmail),
      ]);

      await Promise.all([
        repository.assign({
          actorUserId: admin.id,
          assignment: assignment(owner.id, "STUDIO_PRO"),
          now,
          periodEnd,
        }),
        repository.assign({
          actorUserId: admin.id,
          assignment: assignment(owner.id, "STUDIO_PLUS"),
          now,
          periodEnd,
        }),
      ]);

      expect(
        await database.planSubscription.count({
          where: { userId: owner.id, status: "ACTIVE" },
        }),
      ).toBe(1);
    });

    it("touches nobody else's plan", async () => {
      const [admin, owner, other] = await Promise.all([
        createAdmin(),
        createGoogleAccount(ownerEmail),
        createGoogleAccount(otherEmail),
      ]);

      await repository.assign({
        actorUserId: admin.id,
        assignment: assignment(owner.id),
        now,
        periodEnd,
      });

      await expect(billing.findOwnedPlanKey(other.id, now)).resolves.toBeNull();
    });
  });

  describe("ending an assignment", () => {
    it("ends it and leaves the account on the free plan", async () => {
      const [admin, owner] = await Promise.all([
        createAdmin(),
        createGoogleAccount(ownerEmail),
      ]);
      await repository.assign({
        actorUserId: admin.id,
        assignment: assignment(owner.id),
        now,
        periodEnd,
      });

      await expect(
        repository.revoke({ actorUserId: admin.id, now, userId: owner.id }),
      ).resolves.toEqual({ kind: "REVOKED" });
      await expect(
        billing.findOwnedPlanKey(owner.id, now),
      ).resolves.toBeNull();
    });

    it("keeps the row, so why a plan changed stays answerable", async () => {
      const [admin, owner] = await Promise.all([
        createAdmin(),
        createGoogleAccount(ownerEmail),
      ]);
      await repository.assign({
        actorUserId: admin.id,
        assignment: assignment(owner.id),
        now,
        periodEnd,
      });

      await repository.revoke({ actorUserId: admin.id, now, userId: owner.id });

      expect(
        await database.planSubscription.count({
          where: { userId: owner.id, status: "CANCELLED" },
        }),
      ).toBe(1);
      const audit = await database.auditLog.findFirstOrThrow({
        where: { action: "SUBSCRIPTION_REVOKED" },
        select: { userId: true },
      });
      expect(audit.userId).toBe(admin.id);
    });

    it("never ends a subscription a provider owns", async () => {
      const [admin, owner] = await Promise.all([
        createAdmin(),
        createGoogleAccount(ownerEmail),
      ]);
      await database.planSubscription.create({
        data: {
          userId: owner.id,
          source: "PAYMENT_PROVIDER",
          provider: "stripe",
          providerSubscriptionId: "sub_integration_revoke",
          planKey: "STUDIO_PRO",
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      await expect(
        repository.revoke({ actorUserId: admin.id, now, userId: owner.id }),
      ).resolves.toEqual({ kind: "NOT_ASSIGNED" });
      await expect(billing.findOwnedPlanKey(owner.id, now)).resolves.toBe(
        "STUDIO_PRO",
      );
    });

    it("reports an account with nothing to end", async () => {
      const [admin, owner] = await Promise.all([
        createAdmin(),
        createGoogleAccount(ownerEmail),
      ]);

      await expect(
        repository.revoke({ actorUserId: admin.id, now, userId: owner.id }),
      ).resolves.toEqual({ kind: "NOT_ASSIGNED" });
    });
  });

  describe("listing and reading", () => {
    it("lists assignments in force with who made them", async () => {
      const [admin, owner] = await Promise.all([
        createAdmin(),
        createGoogleAccount(ownerEmail),
      ]);
      await repository.assign({
        actorUserId: admin.id,
        assignment: { ...assignment(owner.id), note: "Pilot migration." },
        now,
        periodEnd,
      });

      await expect(repository.listActive(now)).resolves.toContainEqual(
        expect.objectContaining({
          userId: owner.id,
          planKey: "STUDIO_PRO",
          note: "Pilot migration.",
          assignedByName: "Ops Lead",
        }),
      );
    });

    it("omits an assignment that has been ended", async () => {
      const [admin, owner] = await Promise.all([
        createAdmin(),
        createGoogleAccount(ownerEmail),
      ]);
      await repository.assign({
        actorUserId: admin.id,
        assignment: assignment(owner.id),
        now,
        periodEnd,
      });
      await repository.revoke({ actorUserId: admin.id, now, userId: owner.id });

      const listed = await repository.listActive(now);
      expect(listed.map((row) => row.userId)).not.toContain(owner.id);
    });

    it("says when a provider decides the plan", async () => {
      const owner = await createGoogleAccount(ownerEmail);
      await database.planSubscription.create({
        data: {
          userId: owner.id,
          source: "PAYMENT_PROVIDER",
          provider: "stripe",
          providerSubscriptionId: "sub_integration_live",
          planKey: "STUDIO_PRO",
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      await expect(repository.findLivePlan(owner.id, now)).resolves.toEqual({
        planKey: "STUDIO_PRO",
        providerManaged: true,
      });
    });
  });
});
