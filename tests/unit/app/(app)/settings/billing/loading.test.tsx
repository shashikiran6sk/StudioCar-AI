import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import UsageBillingLoading from "../../../../../../apps/web/src/app/(app)/settings/billing/loading";

describe("UsageBillingLoading", () => {
  it("preserves page geometry while usage loads", () => {
    const { container } = render(<UsageBillingLoading />);
    expect(container.querySelectorAll(".usage-loading__pack")).toHaveLength(2);
    expect(screen.getByRole("status", { name: "Loading usage and billing" })).toBeInTheDocument();
  });
});
