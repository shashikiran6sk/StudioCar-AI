import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminPlanDistribution } from "../../../../apps/web/src/features/admin/admin-plan-distribution";

describe("AdminPlanDistribution", () => {
  it("shows how many accounts each plan carries", () => {
    render(
      <AdminPlanDistribution
        plans={[
          { accountCount: 1_200, planName: "Free" },
          { accountCount: 4, planName: "StudioCar Plus" },
        ]}
      />,
    );

    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("1,200")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("explains an empty distribution rather than showing nothing", () => {
    render(<AdminPlanDistribution plans={[]} />);

    expect(
      screen.getByText("Every account is on the free plan."),
    ).toBeInTheDocument();
  });
});
