import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { LOGIN_PATH } from "../app-routes";
import { AppShell } from "../../features/shell/app-shell";
import { getCurrentSession } from "../../server/auth/get-current-session";
import { getPlanUsageSummary } from "../../server/plan-usage/get-plan-usage-summary";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);

  return (
    <AppShell
      planUsage={await getPlanUsageSummary(session.userId)}
      user={session.user}
    >
      {children}
    </AppShell>
  );
}
