import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildProcessingOptions } from "../../../../apps/web/src/features/studio-treatment/build-processing-options";
import { CustomizeTreatmentStep } from "../../../../apps/web/src/features/vehicle-create/customize-treatment-step";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";

function renderStep(onContinue = vi.fn()) {
  render(<CustomizeTreatmentStep onBack={vi.fn()} onContinue={onContinue} />);
  return onContinue;
}

function floorButtons() {
  const heading = screen.getByRole("heading", { name: /Choose a floor/ });
  const section = heading.parentElement;
  if (!section) throw new Error("Expected the floor section.");
  return within(section).getAllByRole("button");
}

function currentOptions() {
  const { settings, studio, studioBackgroundEnabled } =
    useVehicleCreateStore.getState();
  return buildProcessingOptions({ settings, studio, studioBackgroundEnabled });
}

describe("CustomizeTreatmentStep", () => {
  afterEach(() => act(() => useVehicleCreateStore.getState().reset()));

  it("offers exactly the three studio backgrounds", () => {
    renderStep();

    for (const name of ["Premium White", "Dark Studio", "Grey Studio"]) {
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
    expect(screen.queryByRole("button", { name: /Dealership/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Custom/ })).toBeNull();
  });

  it("asks for a background before floors are offered", () => {
    renderStep();

    expect(
      screen.getByText("Floor options will be shown after selecting a background."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Choose a floor/ })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Next: Choose floor →" }),
    ).toBeDisabled();
  });

  it.each([
    ["Premium White", ["Soft White Floor", "Pearl Grey Turntable"]],
    ["Dark Studio", ["Charcoal Floor", "Graphite Turntable"]],
    ["Grey Studio", ["Light Grey Floor", "Silver Turntable"]],
  ])("shows exactly the two floors of %s", (background, floors) => {
    renderStep();

    fireEvent.click(screen.getByRole("button", { name: background }));

    expect(
      screen.getByRole("heading", { name: `Choose a floor (${background})` }),
    ).toBeInTheDocument();
    expect(
      floorButtons().map((button) => button.textContent?.replace("✓", "")),
    ).toEqual(floors);
  });

  it("stores a background and turntable as semantic IDs and continues", () => {
    const onContinue = renderStep();

    fireEvent.click(screen.getByRole("switch", { name: "Hide Number Plate" }));
    fireEvent.click(screen.getByRole("button", { name: "Dark Studio" }));
    expect(
      screen.getByRole("button", { name: "Charcoal Floor" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Graphite Turntable" }));
    fireEvent.click(screen.getByRole("button", { name: "Review batch →" }));

    expect(useVehicleCreateStore.getState().studio).toEqual({
      backgroundId: "DARK_STUDIO",
      floorId: "DARK_TURNTABLE",
    });
    expect(currentOptions()).toMatchObject({
      backgroundId: "DARK_STUDIO",
      floorId: "DARK_TURNTABLE",
      platePrivacy: false,
    });
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("never keeps a floor from the previous background", () => {
    renderStep();

    fireEvent.click(screen.getByRole("button", { name: "Dark Studio" }));
    fireEvent.click(screen.getByRole("button", { name: "Graphite Turntable" }));
    fireEvent.click(screen.getByRole("button", { name: "Premium White" }));

    expect(useVehicleCreateStore.getState().studio).toEqual({
      backgroundId: "PREMIUM_WHITE",
      floorId: "WHITE_STUDIO",
    });
    expect(screen.queryByRole("button", { name: "Graphite Turntable" })).toBeNull();
  });

  it("keeps the original background when the studio is turned off", () => {
    renderStep();

    fireEvent.click(screen.getByRole("switch", { name: "Studio Background" }));

    expect(currentOptions()).toMatchObject({ backgroundId: "ORIGINAL" });
    expect(screen.getByRole("button", { name: "Premium White" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Review batch →" })).toBeEnabled();
  });

  it("previews every choice from bundled images, never object storage", () => {
    renderStep();
    fireEvent.click(screen.getByRole("button", { name: "Grey Studio" }));

    const sources = Array.from(document.querySelectorAll("img")).map(
      (image) => image.getAttribute("src") ?? "",
    );

    expect(sources).toHaveLength(5);
    for (const source of sources) {
      expect(decodeURIComponent(source)).toContain("/studio-assets/");
      expect(source).not.toMatch(/amazonaws|s3:\/\/|X-Amz-/i);
    }
  });
});
