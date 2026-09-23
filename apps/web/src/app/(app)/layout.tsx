import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { LOGIN_PATH } from "../app-routes";
import { AppShell } from "../../features/shell/app-shell";
import { getCurrentSession } from "../../server/auth/get-current-session";
import { getPlanUsageSummary } from "../../server/plan-usage/get-plan-usage-summary";
import { isCurrentUserAdministrator } from "../../server/admin/is-current-user-administrator";
import { findLargestBatch } from "../../server/plans/find-largest-batch";
import { getPlanCatalog } from "../../server/plans/get-plan-catalog";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);

  return (
    <AppShell
      largestAvailableBatch={findLargestBatch(await getPlanCatalog())}
      planUsage={await getPlanUsageSummary(session.userId)}
      showAdmin={await isCurrentUserAdministrator()}
      user={session.user}
    >
      {children}
    </AppShell>
  );
}
