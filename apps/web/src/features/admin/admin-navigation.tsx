"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_NAVIGATION_ITEMS } from "./admin-navigation.constants";

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Administration" className="admin-navigation">
      {ADMIN_NAVIGATION_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className="admin-navigation__item"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
