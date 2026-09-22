import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock(
  "../../../../apps/web/src/server/admin/manual-subscription-actions",
  () => ({
    assignSubscriptionAction: vi.fn(),
    revokeSubscriptionAction: vi.fn(),
  }),
);

const { ManualSubscriptionList } = await import(
  "../../../../apps/web/src/features/admin/manual-subscription-list"
);

const subscription = {
  assignedByName: "Ops Lead",
  currentPeriodEnd: "2026-12-22T10:00:00.000Z",
  displayName: "Priya",
  email: "priya@example.com",
  id: "0e879f46-1193-4d77-b785-057fe026d998",
  note: "Migrated from the pilot.",
  planName: "Studio Pro",
  userId: "2b8f0ad2-1c37-4a0d-9b93-9b0e1a1f2c34",
};

describe("ManualSubscriptionList", () => {
  it("says what was assigned, until when, and by whom", () => {
    render(<ManualSubscriptionList subscriptions={[subscription]} />);

    expect(
      screen.getByText("Studio Pro until 22 Dec 2026, assigned by Ops Lead."),
    ).toBeInTheDocument();
    expect(screen.getByText("Migrated from the pilot.")).toBeInTheDocument();
  });

  it("offers a way to end it early", () => {
    const { container } = render(
      <ManualSubscriptionList subscriptions={[subscription]} />,
    );

    expect(screen.getByRole("button", { name: "End now" })).toBeEnabled();
    expect(container.querySelector('input[name="userId"]')).toHaveValue(
      subscription.userId,
    );
  });

  it("explains an empty list rather than showing nothing", () => {
    render(<ManualSubscriptionList subscriptions={[]} />);

    expect(
      screen.getByText("No plans have been assigned by hand."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("names an account that has no display name or email", () => {
    render(
      <ManualSubscriptionList
        subscriptions={[{ ...subscription, displayName: null, email: null }]}
      />,
    );

    expect(screen.getByText("Unnamed account")).toBeInTheDocument();
    expect(screen.getByText("No verified email")).toBeInTheDocument();
  });
});
