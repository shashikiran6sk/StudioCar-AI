import { getWebDatabase } from "../db/web-database";
import { cache } from "react";

import type { AdminOverview, PlanAccountCount } from "./admin-overview.types";
import { PrismaAdminOverviewRepository } from "../db/repositories/admin-overview-repository";

let repository: PrismaAdminOverviewRepository | undefined;

function getRepository(): PrismaAdminOverviewRepository {
  repository ??= new PrismaAdminOverviewRepository(
    getWebDatabase(),
  );
  return repository;
}

/**
 * Bounded counts only. The overview is a summary, not a place to read anybody's
 * personal data.
 */
export const getAdminOverview = cache((): Promise<AdminOverview> =>
  getRepository().summarise(),
);

export const getAdminPlanDistribution = cache((): Promise<PlanAccountCount[]> =>
  getRepository().countAccountsByPlan(new Date()),
);
