import type { AuthUser } from "@studiocar/contracts";
import { BrandMark } from "@studiocar/ui";
import type { ReactNode } from "react";

import { AccountMenu } from "./account-menu";
import { AppNavigation } from "./app-navigation";
import { WORKSPACE_LABEL } from "./app-shell.constants";
import { SidebarPlanSummary } from "./sidebar-plan-summary";
import type { PlanUsageSummary } from "../../server/plan-usage/plan-usage.types";
import { ProcessingIndicator } from "../processing/processing-indicator";

export interface AppShellProps {
  children: ReactNode;
  planUsage: PlanUsageSummary | null;
  user: AuthUser;
}

export function AppShell({ children, planUsage, user }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <BrandMark className="app-sidebar__brand" withName />
        <AppNavigation />
        <SidebarPlanSummary summary={planUsage} />
      </aside>
      <div className="app-shell__workspace">
        <header className="app-topbar">
          <div className="app-topbar__activity">
            <ProcessingIndicator />
            <span className="app-topbar__label">{WORKSPACE_LABEL}</span>
          </div>
          <AccountMenu user={user} />
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
