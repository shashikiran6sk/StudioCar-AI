import type { AuthUser } from "@studiocar/contracts";
import { BrandMark } from "@studiocar/ui";
import type { ReactNode } from "react";

import { AccountMenu } from "./account-menu";
import { AppNavigation } from "./app-navigation";
import { ProcessingIndicator } from "../processing/processing-indicator";

const WORKSPACE_LABEL = "Workspace";
const PLAN_HEADING = "Your workspace";
const PLAN_DESCRIPTION = "Plan and usage details are available from billing.";

export interface AppShellProps {
  children: ReactNode;
  user: AuthUser;
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <BrandMark className="app-sidebar__brand" withName />
        <AppNavigation />
        <div className="app-sidebar__plan">
          <strong>{PLAN_HEADING}</strong>
          <span>{PLAN_DESCRIPTION}</span>
        </div>
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
