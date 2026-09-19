"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_NAVIGATION_ITEMS } from "./app-navigation.constants";

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Workspace" className="app-navigation">
      {APP_NAVIGATION_ITEMS.map((item) => {
        const active = pathname === item.href;
        return item.available ? (
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
        ) : (
          <span
            aria-disabled="true"
            className="app-navigation__item app-navigation__item--disabled"
            key={item.href}
          >
            <span aria-hidden="true" className="app-navigation__icon">
              {item.icon}
            </span>
            {item.label}
          </span>
        );
      })}
    </nav>
  );
}
