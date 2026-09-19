import { StatePanel } from "@studiocar/ui";

import { dashboardDate } from "../../../features/dashboard/dashboard-date";
import { dashboardGreeting } from "../../../features/dashboard/dashboard-greeting";
import { userDisplayName } from "../../../features/shell/user-display-name";
import { getCurrentSession } from "../../../server/auth/get-current-session";

const DASHBOARD_DESCRIPTION =
  "Your authenticated workspace is ready for vehicle image workflows.";
const EMPTY_DESCRIPTION =
  "Upload tools and live vehicle activity will appear here as product slices are enabled.";
const EMPTY_TITLE = "Your workspace is ready";
const EMPTY_ICON_LABEL = "SC";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const now = new Date();
  const name = session ? userDisplayName(session.user).split(/\s+/, 1)[0] : undefined;

  return (
    <div className="dashboard-page">
      <header className="app-page-header">
        <div>
          <p className="eyebrow">{dashboardDate(now)}</p>
          <h1>
            {dashboardGreeting(now)}{name ? `, ${name}` : ""}.
          </h1>
          <p>{DASHBOARD_DESCRIPTION}</p>
        </div>
      </header>
      <StatePanel
        description={EMPTY_DESCRIPTION}
        icon={<span aria-hidden="true">{EMPTY_ICON_LABEL}</span>}
        title={EMPTY_TITLE}
      />
    </div>
  );
}
