import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VehicleDetailsForm } from "../../../../apps/web/src/features/vehicle-create/vehicle-details-form";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";

describe("VehicleDetailsForm", () => {
  afterEach(() => {
    act(() => useVehicleCreateStore.getState().reset());
  });

  it("shows field-level errors and does not submit invalid details", async () => {
    const onContinue = vi.fn();
    render(<VehicleDetailsForm onContinue={onContinue} />);

    fireEvent.change(screen.getByRole("textbox", { name: /vehicle name/i }), {
      target: { value: " " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to photos" }));

    expect(await screen.findByText(/too small/i)).toBeVisible();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("normalizes valid details and preserves them in transient state", async () => {
    const onContinue = vi.fn(async () => undefined);
    render(<VehicleDetailsForm onContinue={onContinue} />);

    fireEvent.change(screen.getByRole("textbox", { name: /vehicle name/i }), {
      target: { value: "  Porsche 911 Carrera  " },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Brand" }), {
      target: { value: " Porsche " },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Year" }), {
      target: { value: "2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to photos" }));

    await waitFor(() =>
      expect(onContinue).toHaveBeenCalledWith({
        name: "Porsche 911 Carrera",
        brand: "Porsche",
        year: 2026,
      }),
    );
    expect(useVehicleCreateStore.getState().details.name).toBe(
      "  Porsche 911 Carrera  ",
    );
  });

  it("announces a recoverable submission failure", async () => {
    const onContinue = vi.fn(async () => {
      throw new Error("network unavailable");
    });
    render(<VehicleDetailsForm onContinue={onContinue} />);
    fireEvent.change(screen.getByRole("textbox", { name: /vehicle name/i }), {
      target: { value: "Porsche 911 Carrera" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to photos" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Check the vehicle details and try again.",
    );
  });
});
