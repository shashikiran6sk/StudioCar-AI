import type { AuthUser } from "@studiocar/contracts";
import type { ReactNode } from "react";

import { AccountMenu } from "./account-menu";
import { BrandHomeLink } from "./brand-home-link";
import { AppNavigation } from "./app-navigation";
import { WORKSPACE_LABEL } from "./app-shell.constants";
import { FALLBACK_PLAN_LIMITS, PlanLimitsProvider } from "./plan-limits-context";
import { SidebarPlanSummary } from "./sidebar-plan-summary";
import type { PlanUsageSummary } from "../../server/plan-usage/plan-usage.types";
import { ProcessingIndicator } from "../processing/processing-indicator";

export interface AppShellProps {
  children: ReactNode;
  /** The largest batch any plan on offer allows, or null when none is. */
  largestAvailableBatch: number | null;
  planUsage: PlanUsageSummary | null;
  showAdmin: boolean;
  user: AuthUser;
}

export function AppShell({
  children,
  largestAvailableBatch,
  planUsage,
  showAdmin,
  user,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <BrandHomeLink className="app-sidebar__brand" />
        <AppNavigation showAdmin={showAdmin} />
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
        <main className="app-content">
          <PlanLimitsProvider
            limits={
              planUsage === null
                ? FALLBACK_PLAN_LIMITS
                : {
                    largestAvailableBatch,
                    maxImagesPerBatch: planUsage.maxImagesPerBatch,
                    planName: planUsage.planName,
                  }
            }
          >
            {children}
          </PlanLimitsProvider>
        </main>
      </div>
    </div>
  );
}
