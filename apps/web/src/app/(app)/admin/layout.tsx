import type { ReactNode } from "react";

import { requireAdministrator } from "../../../server/admin/require-administrator";

/**
 * Every administration page is behind this check. Nested pages still assert for
 * themselves where they mutate anything.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireAdministrator();

  return <div className="admin-page">{children}</div>;
}
