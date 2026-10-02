import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { LOGIN_PATH } from "../app-routes";
import { AppShell } from "../../features/shell/app-shell";
import { getCurrentSession } from "../../server/auth/get-current-session";
import { getPlanUsageSummary } from "../../server/plan-usage/get-plan-usage-summary";
import { isCurrentUserAdministrator } from "../../server/admin/is-current-user-administrator";
import { findLargestBatch } from "../../server/plans/find-largest-batch";
import { getPlanCatalog } from "../../server/plans/get-plan-catalog";
import { privateRobots } from "../../lib/private-robots";

export const metadata: Metadata = { robots: privateRobots };

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);

  const [planCatalog, planUsage, showAdmin] = await Promise.all([
    getPlanCatalog(),
    getPlanUsageSummary(session.userId),
    isCurrentUserAdministrator(),
  ]);

  return (
    <AppShell
      largestAvailableBatch={findLargestBatch(planCatalog)}
      planUsage={planUsage}
      showAdmin={showAdmin}
      user={session.user}
    >
      {children}
    </AppShell>
  );
}
