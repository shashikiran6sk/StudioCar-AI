import { requireAdministrator } from "../../../server/admin/require-administrator";
import { getAdminOverview } from "../../../server/admin/get-admin-overview";
import { AdminOverviewStats } from "../../../features/admin/admin-overview-stats";
import {
  ADMIN_OVERVIEW_DESCRIPTION,
  ADMIN_OVERVIEW_EYEBROW,
  ADMIN_OVERVIEW_TITLE,
} from "../../../server/admin/admin.constants";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdministrator();
  const overview = await getAdminOverview();

  return (
    <>
      <header className="app-page-header">
        <div>
          <p className="eyebrow">{ADMIN_OVERVIEW_EYEBROW}</p>
          <h1>{ADMIN_OVERVIEW_TITLE}</h1>
          <p>{ADMIN_OVERVIEW_DESCRIPTION}</p>
        </div>
      </header>
      <AdminOverviewStats overview={overview} />
    </>
  );
}
