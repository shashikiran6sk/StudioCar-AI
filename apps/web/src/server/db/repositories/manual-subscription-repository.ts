import type { ManualSubscriptionAssignment } from "@studiocar/contracts";
import type { PrismaClient } from "@studiocar/database-runtime";
import {
  AuthProvider,
  CreditLedgerType,
  SubscriptionSource,
  SubscriptionStatus,
} from "@studiocar/database-runtime";

import {
  AUDIT_ACTION_SUBSCRIPTION_ASSIGNED,
  AUDIT_ACTION_SUBSCRIPTION_REVOKED,
  AUDIT_RESOURCE_PLAN_SUBSCRIPTION,
  MANUAL_SUBSCRIPTION_LOCK_KEY,
} from "../../admin/admin.constants";

/** The statuses that mean a subscription currently decides somebody's plan. */
const LIVE_STATUSES = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING];

export interface AccountRecord {
  userId: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
}

export interface ManualSubscriptionRecord {
  id: string;
  userId: string;
  displayName: string | null;
  email: string | null;
  planKey: string;
  currentPeriodEnd: Date;
  note: string | null;
  assignedByName: string | null;
}

export type AssignManualSubscriptionResult =
  | { kind: "ASSIGNED" }
  /** An assignment was already in force and has been replaced. */
  | { kind: "REPLACED" }
  /** Refused: a payment provider owns this account's subscription. */
  | { kind: "PROVIDER_MANAGED" }
  | { kind: "UNKNOWN_ACCOUNT" };

export type RevokeManualSubscriptionResult =
  { kind: "REVOKED" } | { kind: "NOT_ASSIGNED" };

export class PrismaManualSubscriptionRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async grantPlusCredits(command: { actorUserId: string; userId: string; note?: string }): Promise<"GRANTED" | "UNKNOWN_ACCOUNT"> {
    return this.database.$transaction(async (transaction) => {
      const [account, plan] = await Promise.all([
        transaction.user.findUnique({ where: { id: command.userId }, select: { id: true } }),
        transaction.planConfig.findUnique({ where: { planKey: "STUDIO_PLUS" }, select: { active: true, includedImages: true } }),
      ]);
      if (!account) return "UNKNOWN_ACCOUNT";
      if (!plan?.active) throw new Error("Studio Plus is unavailable.");
      const entry = await transaction.creditLedger.create({
        data: {
          userId: command.userId,
          amount: plan.includedImages,
          type: CreditLedgerType.ADMIN_ADJUSTMENT,
          referenceId: crypto.randomUUID(),
        },
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          userId: command.actorUserId,
          action: "ADMIN_CREDIT_GRANTED",
          resourceType: "CreditLedger",
          resourceId: entry.id,
          metadata: { accountUserId: command.userId, amount: plan.includedImages, note: command.note ?? null },
        },
      });
      return "GRANTED";
    });
  }

  /**
   * Finds the one account that has **verified** an exact contact.
   *
   * A profile value is not proof. Only an `AuthIdentity` the account actually
   * signed in with counts, so an address somebody merely typed into their
   * profile can never be used to find — or fund — somebody else's account.
   */
  public async findAccountByVerifiedContact(
    contact: { email: string } | { phoneNumber: string },
  ): Promise<AccountRecord | null> {
    const where =
      "email" in contact
        ? {
            provider: AuthProvider.GOOGLE,
            email: contact.email,
            emailVerifiedAt: { not: null },
          }
        : {
            provider: AuthProvider.PHONE,
            phoneNumber: contact.phoneNumber,
          };

    const identity = await this.database.authIdentity.findFirst({
      where,
      select: {
        email: true,
        phoneNumber: true,
        user: { select: { id: true, displayName: true } },
      },
    });
    if (!identity) return null;

    return {
      userId: identity.user.id,
      displayName: identity.user.displayName,
      email: identity.email,
      phoneNumber: identity.phoneNumber,
    };
  }

  /**
   * Grants paid plan access manually without recording a provider payment.
   *
   * A subscription a provider owns is never touched: the provider is the
   * authority on what somebody has paid for, and overwriting its row here
   * would leave the two disagreeing with no way to tell which is right.
   *
   * At most one assignment is ever in force. Reassigning replaces the existing
   * one inside the same transaction, which the partial unique index also
   * enforces, so two administrators acting at once cannot create a second.
   */
  public assign(command: {
    actorUserId: string;
    assignment: ManualSubscriptionAssignment;
    now: Date;
    periodEnd: Date;
  }): Promise<AssignManualSubscriptionResult> {
    return this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${MANUAL_SUBSCRIPTION_LOCK_KEY} || ${command.assignment.userId}, 0))`;

      const account = await transaction.user.findUnique({
        where: { id: command.assignment.userId },
        select: { id: true },
      });
      if (!account) return { kind: "UNKNOWN_ACCOUNT" };

      const providerOwned = await transaction.planSubscription.findFirst({
        where: {
          userId: command.assignment.userId,
          source: SubscriptionSource.PAYMENT_PROVIDER,
          status: { in: LIVE_STATUSES },
          currentPeriodEnd: { gt: command.now },
        },
        select: { id: true },
      });
      if (providerOwned) return { kind: "PROVIDER_MANAGED" };

      /**
       * Every manual row the unique index counts is closed, not only those
       * still inside their period. An expired row left `ACTIVE` still occupies
       * the index and would make the insert below fail.
       */
      const replaced = await transaction.planSubscription.updateMany({
        where: {
          userId: command.assignment.userId,
          source: SubscriptionSource.MANUAL_ADMIN,
          status: { in: LIVE_STATUSES },
        },
        data: { status: SubscriptionStatus.CANCELLED },
      });

      const created = await transaction.planSubscription.create({
        data: {
          userId: command.assignment.userId,
          source: SubscriptionSource.MANUAL_ADMIN,
          planKey: command.assignment.planKey,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: command.now,
          currentPeriodEnd: command.periodEnd,
          assignedByUserId: command.actorUserId,
          ...(command.assignment.note === undefined
            ? {}
            : { note: command.assignment.note }),
        },
        select: { id: true },
      });

      await transaction.auditLog.create({
        data: {
          userId: command.actorUserId,
          action: AUDIT_ACTION_SUBSCRIPTION_ASSIGNED,
          resourceType: AUDIT_RESOURCE_PLAN_SUBSCRIPTION,
          resourceId: created.id,
          metadata: {
            accountUserId: command.assignment.userId,
            planKey: command.assignment.planKey,
            months: command.assignment.months,
            replaced: replaced.count,
          },
        },
      });

      return replaced.count > 0 ? { kind: "REPLACED" } : { kind: "ASSIGNED" };
    });
  }

  /**
   * Ends an assignment early, leaving the account on the free plan.
   *
   * The row is cancelled rather than deleted, and its period is left as it was
   * granted, so what somebody was given and when it was withdrawn both stay
   * answerable.
   */
  public revoke(command: {
    actorUserId: string;
    now: Date;
    userId: string;
  }): Promise<RevokeManualSubscriptionResult> {
    return this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${MANUAL_SUBSCRIPTION_LOCK_KEY} || ${command.userId}, 0))`;

      const existing = await transaction.planSubscription.findFirst({
        where: {
          userId: command.userId,
          source: SubscriptionSource.MANUAL_ADMIN,
          status: { in: LIVE_STATUSES },
          currentPeriodEnd: { gt: command.now },
        },
        select: { id: true, planKey: true },
      });
      if (!existing) return { kind: "NOT_ASSIGNED" };

      /**
       * Only the status changes. `CANCELLED` is what takes the row out of
       * every live query, and rewriting the period would erase what was
       * actually granted — which is the reason the row is kept at all.
       */
      await transaction.planSubscription.update({
        where: { id: existing.id },
        data: { status: SubscriptionStatus.CANCELLED },
      });
      await transaction.auditLog.create({
        data: {
          userId: command.actorUserId,
          action: AUDIT_ACTION_SUBSCRIPTION_REVOKED,
          resourceType: AUDIT_RESOURCE_PLAN_SUBSCRIPTION,
          resourceId: existing.id,
          metadata: {
            accountUserId: command.userId,
            planKey: existing.planKey,
          },
        },
      });

      return { kind: "REVOKED" };
    });
  }

  /** Every assignment currently in force, for the administration page. */
  public async listActive(now: Date): Promise<ManualSubscriptionRecord[]> {
    const subscriptions = await this.database.planSubscription.findMany({
      where: {
        source: SubscriptionSource.MANUAL_ADMIN,
        status: { in: LIVE_STATUSES },
        currentPeriodEnd: { gt: now },
      },
      orderBy: [{ currentPeriodEnd: "asc" }, { id: "asc" }],
      select: {
        id: true,
        userId: true,
        planKey: true,
        currentPeriodEnd: true,
        note: true,
        user: { select: { displayName: true, primaryEmail: true } },
        assignedBy: { select: { displayName: true } },
      },
    });

    return subscriptions.map((subscription) => ({
      id: subscription.id,
      userId: subscription.userId,
      displayName: subscription.user.displayName,
      email: subscription.user.primaryEmail,
      planKey: subscription.planKey,
      currentPeriodEnd: subscription.currentPeriodEnd,
      note: subscription.note,
      assignedByName: subscription.assignedBy?.displayName ?? null,
    }));
  }

  /**
   * The plan an account is on right now, and whether a provider decides it.
   *
   * `providerManaged` is a boolean rather than the stored enum so that pages
   * depend on what the answer means, not on a Prisma type.
   */
  public async findLivePlan(
    userId: string,
    now: Date,
  ): Promise<{ planKey: string; providerManaged: boolean } | null> {
    const subscription = await this.database.planSubscription.findFirst({
      where: {
        userId,
        status: { in: LIVE_STATUSES },
        currentPeriodEnd: { gt: now },
      },
      orderBy: [{ currentPeriodEnd: "desc" }, { id: "desc" }],
      select: { planKey: true, source: true },
    });
    if (!subscription) return null;

    return {
      planKey: subscription.planKey,
      providerManaged:
        subscription.source === SubscriptionSource.PAYMENT_PROVIDER,
    };
  }
}
