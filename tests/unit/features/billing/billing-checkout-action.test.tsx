import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BillingCheckoutAction } from "../../../../apps/web/src/features/billing/billing-checkout-action";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("next/script", () => ({ default: () => null }));

describe("BillingCheckoutAction", () => {
  it("does not open checkout until the provider script is ready", () => {
    render(<BillingCheckoutAction includedImages={100} label="Choose Studio Plus" planKey="STUDIO_PLUS" variant="secondary" />);
    expect(screen.getByRole("button", { name: "Choose Studio Plus" })).toBeDisabled();
  });
});
