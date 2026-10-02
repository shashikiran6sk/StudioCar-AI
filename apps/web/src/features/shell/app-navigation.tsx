"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigationItemIsActive } from "./navigation-item-is-active";
import { workspaceNavigationItems } from "./workspace-navigation-items";

export interface AppNavigationProps {
  /** Called when a destination is chosen, so a drawer can close itself. */
  onNavigate?: () => void;
  showAdmin: boolean;
}

export function AppNavigation({ onNavigate, showAdmin }: AppNavigationProps) {
  const pathname = usePathname();
  const items = workspaceNavigationItems(showAdmin);

  return (
    <nav aria-label="Workspace" className="app-navigation">
      {items.map((item) => {
        const active = navigationItemIsActive(pathname, item.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className="app-navigation__item"
            href={item.href}
            key={item.href}
            {...(onNavigate ? { onClick: onNavigate } : {})}
          >
            <span aria-hidden="true" className="app-navigation__icon">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
