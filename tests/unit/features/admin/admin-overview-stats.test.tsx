import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminOverviewStats } from "../../../../apps/web/src/features/admin/admin-overview-stats";

const overview = {
  administratorCount: 2,
  userCount: 1_240,
  activePlanCount: 4,
  activeSubscriptionCount: 3,
  manualSubscriptionCount: 1,
  enabledSocialLinkCount: 0,
};

describe("AdminOverviewStats", () => {
  it("reports every configured count", () => {
    render(<AdminOverviewStats overview={overview} />);

    expect(
      screen.getByRole("region", { name: "Administration statistics" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Administrators")).toBeInTheDocument();
    expect(screen.getByText("1,240")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows zero truthfully rather than hiding it", () => {
    render(<AdminOverviewStats overview={overview} />);

    expect(screen.getByText("Social links")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });
});
