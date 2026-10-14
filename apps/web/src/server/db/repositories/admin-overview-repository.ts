import type { PrismaClient } from "@studiocar/database-runtime";
import { z } from "zod";
import type { AdminOverview, PlanAccountCount } from "../../admin/admin-overview.types";

const PaidAccountCountSchema = z.array(z.object({ count: z.coerce.number().int().nonnegative() }));
export class PrismaAdminOverviewRepository {
  public constructor(private readonly database: PrismaClient) {}
  public async countAccountsByPlan(): Promise<PlanAccountCount[]> {
    const rows = PaidAccountCountSchema.parse(await this.database.$queryRaw`
      SELECT COUNT(DISTINCT "userId") AS count FROM "CreditLedger"
      WHERE "type" IN ('PURCHASE_GRANT', 'ADMIN_ADJUSTMENT') AND "amount" > 0
    `);
    const count = rows[0]?.count ?? 0;
    return count ? [{ planKey: "STUDIO_PLUS", accountCount: count }] : [];
  }
  public async summarise(): Promise<AdminOverview> {
    const [administratorCount, userCount, activePlanCount, paid, enabledSocialLinkCount] = await Promise.all([
      this.database.userRole.count({ where: { role: "ADMIN" } }), this.database.user.count(),
      this.database.planConfig.count({ where: { active: true, planKey: { in: ["FREE", "STUDIO_PLUS"] } } }),
      this.countAccountsByPlan(), this.database.socialLink.count({ where: { enabled: true } }),
    ]);
    return { administratorCount, userCount, activePlanCount, paidAccountCount: paid[0]?.accountCount ?? 0, enabledSocialLinkCount };
  }
}
