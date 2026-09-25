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
    fireEvent.click(screen.getByText("Add vehicle specifications (optional)"));
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

  it("continues with only a vehicle name and keeps specifications optional", async () => {
    const onContinue = vi.fn(async () => undefined);
    render(<VehicleDetailsForm onContinue={onContinue} />);

    expect(screen.queryByRole("textbox", { name: /internal id/i })).not.toBeInTheDocument();
    expect(screen.getByText("Enter a name that helps you identify this vehicle.")).toBeVisible();
    expect(screen.getByText("Your dealership's existing vehicle reference. Optional.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Brand" }).closest("details")).not.toHaveAttribute("open");
    fireEvent.change(screen.getByRole("textbox", { name: /vehicle name/i }), {
      target: { value: "2025 Porsche 911 Carrera" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to photos" }));

    await waitFor(() => expect(onContinue).toHaveBeenCalledWith({
      name: "2025 Porsche 911 Carrera",
    }));
  });

  it("expands and collapses the optional specifications", () => {
    render(<VehicleDetailsForm onContinue={vi.fn()} />);
    const summary = screen.getByText("Add vehicle specifications (optional)");
    const specifications = summary.closest("details");

    fireEvent.click(summary);
    expect(specifications?.open).toBe(true);
    expect(screen.getByRole("textbox", { name: "Brand" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Model" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Variant" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Year" })).toBeVisible();
    fireEvent.click(summary);
    expect(specifications?.open).toBe(false);
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
