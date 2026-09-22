import type { PrismaClient } from "@studiocar/database-runtime";
import {
  Role,
  SubscriptionSource,
  SubscriptionStatus,
} from "@studiocar/database-runtime";

import type { AdminOverview } from "../../admin/admin-overview.types";

export class PrismaAdminOverviewRepository {
  public constructor(private readonly database: PrismaClient) {}

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
