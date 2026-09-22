"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ADMIN_NAVIGATION_ITEM,
  APP_NAVIGATION_ITEMS,
} from "./app-navigation.constants";
import { navigationItemIsActive } from "./navigation-item-is-active";

export interface AppNavigationProps {
  showAdmin: boolean;
}

export function AppNavigation({ showAdmin }: AppNavigationProps) {
  const pathname = usePathname();
  const items = showAdmin
    ? [...APP_NAVIGATION_ITEMS, ADMIN_NAVIGATION_ITEM]
    : APP_NAVIGATION_ITEMS;

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
