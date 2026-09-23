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
  it("lets a studio background stand the vehicle on a turntable", () => {
    render(<CustomizeTreatmentStep onBack={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Studio floor" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Turntable" }));

    expect(useVehicleCreateStore.getState().options.floor).toBe("TURNTABLE");
  });

  it("offers no floor when the background has none", () => {
    render(<CustomizeTreatmentStep onBack={vi.fn()} onContinue={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Dealership" }));

    // Only the three studio backgrounds are drawn with a wall and a floor.
    expect(screen.getByRole("button", { name: "Turntable" })).toBeDisabled();
  });
});
