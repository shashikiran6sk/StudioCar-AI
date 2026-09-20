import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UsageQuotaCard } from "../../../../apps/web/src/features/billing/usage-quota-card";

describe("UsageQuotaCard", () => {
  it("renders a truthful bounded quota", () => {
    render(<UsageQuotaCard capacity={3} label="Upload sessions used" value="2 / 3" valueAmount={2} />);
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
  });
});
