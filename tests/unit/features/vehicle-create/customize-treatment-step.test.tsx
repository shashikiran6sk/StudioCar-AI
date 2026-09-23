import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CustomizeTreatmentStep } from "../../../../apps/web/src/features/vehicle-create/customize-treatment-step";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";

describe("CustomizeTreatmentStep", () => {
  afterEach(() => act(() => useVehicleCreateStore.getState().reset()));

  it("stores normalized treatment values and navigates to review", () => {
    const onContinue = vi.fn();
    render(
      <CustomizeTreatmentStep onBack={vi.fn()} onContinue={onContinue} />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Hide Number Plate" }));
    fireEvent.click(screen.getByRole("button", { name: "Dark Studio" }));
    fireEvent.click(screen.getByRole("button", { name: "Review batch →" }));

    expect(useVehicleCreateStore.getState().options).toMatchObject({
      background: "DARK_STUDIO",
      platePrivacy: false,
    });
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("disables studio presets when background treatment is off", () => {
    render(<CustomizeTreatmentStep onBack={vi.fn()} onContinue={vi.fn()} />);

    fireEvent.click(screen.getByRole("switch", { name: "Studio Background" }));

    expect(useVehicleCreateStore.getState().options.background).toBe(
      "ORIGINAL",
    );
    expect(screen.getByRole("button", { name: "Premium White" })).toBeDisabled();
  });
  it("offers exactly three studio backgrounds", () => {
    render(<CustomizeTreatmentStep onBack={vi.fn()} onContinue={vi.fn()} />);

    for (const name of ["Premium White", "Dark Studio", "Grey Studio"]) {
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
    expect(screen.queryByRole("button", { name: "Dealership" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Custom" })).toBeNull();
  });

  it("offers a plain background or the standard floor, and no turntable", () => {
    render(<CustomizeTreatmentStep onBack={vi.fn()} onContinue={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Standard floor" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: /Turntable/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Plain background" }));

    expect(useVehicleCreateStore.getState().options.floor).toBe("PLAIN");
  });

  it("offers no floor when the studio background is off", () => {
    render(<CustomizeTreatmentStep onBack={vi.fn()} onContinue={vi.fn()} />);

    fireEvent.click(screen.getByRole("switch", { name: "Studio Background" }));

    expect(screen.getByRole("button", { name: "Plain background" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Standard floor" })).toBeDisabled();
  });
});
