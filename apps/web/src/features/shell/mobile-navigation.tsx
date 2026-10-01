"use client";

import { Sheet, SheetContent, SheetTrigger } from "@studiocar/ui";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AppNavigation } from "./app-navigation";
import {
  MOBILE_NAVIGATION_CLOSE_LABEL,
  MOBILE_NAVIGATION_DESCRIPTION,
  MOBILE_NAVIGATION_OPEN_LABEL,
  MOBILE_NAVIGATION_TITLE,
} from "./app-shell.constants";
import { BrandHomeLink } from "./brand-home-link";
import { findActiveNavigationItem } from "./find-active-navigation-item";
import { LogoutForm } from "./logout-form";
import { SidebarPlanSummary } from "./sidebar-plan-summary";
import { workspaceNavigationItems } from "./workspace-navigation-items";
import type { PlanUsageSummary } from "../../server/plan-usage/plan-usage.types";

export interface MobileNavigationProps {
  planUsage: PlanUsageSummary | null;
  showAdmin: boolean;
}

/**
 * The workspace sidebar for narrow screens: a menu control and the current
 * section in the top bar, and the same destinations, plan summary, and log out
 * in a drawer. Hidden by CSS wherever the desktop sidebar is shown.
 */
export function MobileNavigation({ planUsage, showAdmin }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = findActiveNavigationItem(
    pathname,
    workspaceNavigationItems(showAdmin),
  );
  const close = () => setOpen(false);

  return (
    <div className="mobile-navigation">
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetTrigger asChild>
          <button
            aria-label={MOBILE_NAVIGATION_OPEN_LABEL}
            className="mobile-navigation__trigger"
            type="button"
          >
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </SheetTrigger>
        <SheetContent
          closeLabel={MOBILE_NAVIGATION_CLOSE_LABEL}
          description={MOBILE_NAVIGATION_DESCRIPTION}
          header={<BrandHomeLink onNavigate={close} />}
          title={MOBILE_NAVIGATION_TITLE}
        >
          <AppNavigation onNavigate={close} showAdmin={showAdmin} />
          <SidebarPlanSummary summary={planUsage} />
          <LogoutForm className="mobile-navigation__logout" />
        </SheetContent>
      </Sheet>
      {active ? (
        <span className="mobile-navigation__section">{active.label}</span>
      ) : null}
    </div>
  );
}
