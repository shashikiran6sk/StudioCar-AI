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
});
