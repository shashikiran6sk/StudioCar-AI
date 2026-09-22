import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock(
  "../../../../apps/web/src/server/admin/plan-configuration-actions",
  () => ({ savePlanConfigurationAction: vi.fn() }),
);

const { PlanConfigurationForm } = await import(
  "../../../../apps/web/src/features/admin/plan-configuration-form"
);
const { toPlanConfigurationFields } = await import(
  "../../../../apps/web/src/features/admin/to-plan-configuration-fields"
);
const { FALLBACK_PLAN_ENTRY } = await import(
  "../../../../apps/web/src/server/plans/default-plan-catalog"
);

const fields = toPlanConfigurationFields(FALLBACK_PLAN_ENTRY);

describe("PlanConfigurationForm", () => {
  it("shows every value in the units an administrator enters them in", () => {
    render(<PlanConfigurationForm plan={fields} />);

    expect(screen.getByLabelText(/Price/)).toHaveValue(0);
    expect(screen.getByLabelText(/Images included/)).toHaveValue(15);
    expect(screen.getByLabelText(/Maximum images per batch/)).toHaveValue(5);
    expect(screen.getByLabelText(/Storage/)).toHaveValue(3);
  });

  it("carries the plan key the submission applies to", () => {
    const { container } = render(<PlanConfigurationForm plan={fields} />);

    expect(container.querySelector('input[name="planKey"]')).toHaveValue("FREE");
  });

  it("labels each control so it can be reached without sight", () => {
    render(<PlanConfigurationForm plan={fields} />);

    expect(screen.getByLabelText(/Billing interval/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Offered to customers/)).toBeChecked();
    expect(screen.getByLabelText(/Available to buy/)).not.toBeChecked();
  });

  it("keeps two plans' controls distinct when both are on the page", () => {
    render(
      <>
        <PlanConfigurationForm plan={fields} />
        <PlanConfigurationForm
          plan={{ ...fields, planKey: "STUDIO_PRO", displayName: "Studio Pro" }}
        />
      </>,
    );

    // Duplicate ids would point both labels at the same input.
    expect(screen.getAllByLabelText(/Images included/)).toHaveLength(2);
  });
});
