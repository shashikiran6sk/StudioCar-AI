import type { PrismaClient } from "@studiocar/database-runtime";
import {
  Role,
  SubscriptionSource,
  SubscriptionStatus,
} from "@studiocar/database-runtime";

import type {
  AdminOverview,
  PlanAccountCount,
} from "../../admin/admin-overview.types";

export class PrismaAdminOverviewRepository {
  public constructor(private readonly database: PrismaClient) {}

  /**
   * How many accounts each paid plan currently carries.
   *
   * Counts only, grouped in the database. The overview is a summary, not a
   * place to read anybody's personal data. Accounts with no live subscription
   * are absent rather than counted as a "free" group, because no row means no
   * subscription rather than a subscription to nothing.
   */
  public async countAccountsByPlan(now: Date): Promise<PlanAccountCount[]> {
    const grouped = await this.database.planSubscription.groupBy({
      by: ["planKey"],
      where: {
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
        },
        currentPeriodEnd: { gt: now },
      },
      _count: { _all: true },
      orderBy: { planKey: "asc" },
    });

    return grouped.map((group) => ({
      accountCount: group._count._all,
      planKey: group.planKey,
    }));
  }

  public async summarise(): Promise<AdminOverview> {
    const activeStatuses = [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.TRIALING,
    ];

    const [
      administratorCount,
      userCount,
      activePlanCount,
      activeSubscriptionCount,
      manualSubscriptionCount,
      enabledSocialLinkCount,
    ] = await Promise.all([
      this.database.userRole.count({ where: { role: Role.ADMIN } }),
      this.database.user.count(),
      this.database.planConfig.count({ where: { active: true } }),
      this.database.planSubscription.count({
        where: { status: { in: activeStatuses } },
      }),
      this.database.planSubscription.count({
        where: {
          source: SubscriptionSource.MANUAL_ADMIN,
          status: { in: activeStatuses },
        },
      }),
      this.database.socialLink.count({ where: { enabled: true } }),
    ]);

    return {
      administratorCount,
      userCount,
      activePlanCount,
      activeSubscriptionCount,
      manualSubscriptionCount,
      enabledSocialLinkCount,
    };
  }
}
