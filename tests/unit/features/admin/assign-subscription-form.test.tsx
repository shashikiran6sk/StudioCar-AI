import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock(
  "../../../../apps/web/src/server/admin/manual-subscription-actions",
  () => ({
    assignSubscriptionAction: vi.fn(),
    revokeSubscriptionAction: vi.fn(),
  }),
);

const { AssignSubscriptionForm } = await import(
  "../../../../apps/web/src/features/admin/assign-subscription-form"
);

const props = {
  accountLabel: "Priya — On Free.",
  currentPlanKey: null,
  defaultMonths: 1,
  maximumMonths: 24,
  minimumMonths: 1,
  plans: [
    { displayName: "Studio Pro", planKey: "STUDIO_PRO" },
    { displayName: "Studio Plus", planKey: "STUDIO_PLUS" },
  ],
  userId: "2b8f0ad2-1c37-4a0d-9b93-9b0e1a1f2c34",
};

describe("AssignSubscriptionForm", () => {
  it("names the account and the plan it is on", () => {
    render(<AssignSubscriptionForm {...props} />);

    expect(screen.getByText("Priya — On Free.")).toBeInTheDocument();
  });

  it("offers only the plans it was given", () => {
    render(<AssignSubscriptionForm {...props} />);

    expect(
      screen.getByRole("option", { name: "Studio Plus" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Free" })).not.toBeInTheDocument();
  });

  it("bounds the length of an assignment in the control itself", () => {
    render(<AssignSubscriptionForm {...props} />);

    const months = screen.getByLabelText(/Months/);
    expect(months).toHaveAttribute("min", "1");
    expect(months).toHaveAttribute("max", "24");
    expect(months).toHaveValue(1);
  });

  it("carries the account the assignment applies to", () => {
    const { container } = render(<AssignSubscriptionForm {...props} />);

    expect(container.querySelector('input[name="userId"]')).toHaveValue(
      props.userId,
    );
  });

  it("says the reason is recorded", () => {
    render(<AssignSubscriptionForm {...props} />);

    expect(screen.getByLabelText(/recorded in the audit log/)).toBeInTheDocument();
  });
  it("preselects the plan the account is already on", () => {
    render(<AssignSubscriptionForm {...props} currentPlanKey="STUDIO_PLUS" />);

    expect(screen.getByLabelText(/^Plan$/)).toHaveValue("STUDIO_PLUS");
  });

  it("falls back to the first plan when the account is on none of them", () => {
    render(<AssignSubscriptionForm {...props} currentPlanKey="FREE" />);

    expect(screen.getByLabelText(/^Plan$/)).toHaveValue("STUDIO_PRO");
  });
});
