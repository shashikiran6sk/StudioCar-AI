import type { AuthUser } from "@studiocar/contracts";
import { BrandMark } from "@studiocar/ui";
import type { ReactNode } from "react";

import { AccountMenu } from "./account-menu";
import { AppNavigation } from "./app-navigation";
import {
  DEFAULT_MAX_IMAGES_PER_BATCH,
  WORKSPACE_LABEL,
} from "./app-shell.constants";
import { PlanLimitsProvider } from "./plan-limits-context";
import { SidebarPlanSummary } from "./sidebar-plan-summary";
import type { PlanUsageSummary } from "../../server/plan-usage/plan-usage.types";
import { ProcessingIndicator } from "../processing/processing-indicator";

export interface AppShellProps {
  children: ReactNode;
  planUsage: PlanUsageSummary | null;
  showAdmin: boolean;
  user: AuthUser;
}

export function AppShell({
  children,
  planUsage,
  showAdmin,
  user,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <BrandMark className="app-sidebar__brand" withName />
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
            limits={{
              maxImagesPerBatch:
                planUsage?.maxImagesPerBatch ?? DEFAULT_MAX_IMAGES_PER_BATCH,
            }}
          >
            {children}
          </PlanLimitsProvider>
        </main>
      </div>
    </div>
  );
}
