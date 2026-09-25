import type { ReactNode } from "react";
import type { Metadata } from "next";

import { AdminNavigation } from "../../../features/admin/admin-navigation";
import { requireAdministrator } from "../../../server/admin/require-administrator";
import { privateRobots } from "../../../lib/private-robots";

export const metadata: Metadata = { robots: privateRobots };

/**
 * Every administration page is behind this check. Nested pages still assert for
 * themselves where they mutate anything.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireAdministrator();

  return (
    <div className="admin-page">
      <AdminNavigation />
      {children}
    </div>
  );
}
