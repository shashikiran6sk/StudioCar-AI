import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VehicleCreateLauncher } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-launcher";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("VehicleCreateLauncher", () => {
  it("opens the screenshot-derived vehicle workflow from the dashboard CTA", () => {
    render(<VehicleCreateLauncher />);

    fireEvent.click(screen.getByRole("button", { name: "+ Upload Vehicle" }));

    expect(screen.getByRole("dialog", { name: "Vehicle details" })).toBeVisible();
  });
});
