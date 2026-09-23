import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VehicleCreateDialog } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-dialog";
import type { requestCreateVehicleDraft } from "../../../../apps/web/src/features/vehicle-create/request-create-vehicle-draft";
import type { requestUpdateVehicleDraft } from "../../../../apps/web/src/features/vehicle-create/request-update-vehicle-draft";
import type { uploadPhoto } from "../../../../apps/web/src/features/vehicle-create/upload-photo";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";
import {
  SECOND_ASSET_ID,
  VEHICLE_ID,
  failedSelectionContext,
  selectionContext,
} from "./studio-selection-test-data";

describe("VehicleCreateDialog", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    act(() => useVehicleCreateStore.getState().reset());
    vi.restoreAllMocks();
  });

  it("orchestrates all four steps and resets after processing starts", async () => {
    const createDraft = vi.fn<typeof requestCreateVehicleDraft>(async () => ({
      replayed: false,
      vehicle: {
        id: "0e879f46-1193-4d77-b785-057fe026d998",
        name: "2022 BMW 3 Series",
        brand: null,
        model: null,
        variant: null,
        year: null,
        stockId: null,
        internalId: null,
        notes: null,
        status: "DRAFT",
        createdAt: "2026-09-19T10:00:00.000Z",
        updatedAt: "2026-09-19T10:00:00.000Z",
      },
    }));
    const upload = vi.fn<typeof uploadPhoto>(async () => ({
      assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
      height: 1080,
      width: 1920,
    }));
    const onProcess = vi.fn(async () => undefined);
    const updateDraft = vi.fn<typeof requestUpdateVehicleDraft>();
    render(
      <VehicleCreateDialog
        batchLimitLabel="Free plan · Up to 5 images per batch."
        maxImagesPerBatch={5}
      createDraft={createDraft}
        onProcess={onProcess}
        trigger={<button type="button">Upload vehicle</button>}
        updateDraft={updateDraft}
        upload={upload}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Upload vehicle" }));
    fireEvent.change(screen.getByRole("textbox", { name: /vehicle name/i }), {
      target: { value: "2022 BMW 3 Series" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to photos" }));
    await screen.findByRole("dialog", { name: "Upload photos" });

    fireEvent.change(screen.getByLabelText("Select photos"), {
      target: {
        files: [new File(["image"], "vehicle.jpg", { type: "image/jpeg" })],
      },
    });
    await screen.findByText("Uploaded");
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to customize →" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Customize treatment" }),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Dark Studio" }));
    fireEvent.click(screen.getByRole("button", { name: "Review batch →" }));
    expect(screen.getByRole("dialog", { name: "Review & process" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Process Photos" }));

    await waitFor(() => expect(onProcess).toHaveBeenCalledOnce());
    expect(onProcess).toHaveBeenCalledWith(
      {
        assetIds: ["331a1e25-b9d8-4b1a-a398-8351a58f8c24"],
        options: expect.objectContaining({ background: "DARK_STUDIO" }),
        vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
      },
      expect.any(String),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(useVehicleCreateStore.getState().vehicleId).toBeNull();
  });

  it("opens a new studio version on the vehicle's photos and submits a changed treatment", async () => {
    const onProcess = vi.fn(async () => undefined);
    const onCancel = vi.fn();
    const createDraft = vi.fn<typeof requestCreateVehicleDraft>();
    render(
      <VehicleCreateDialog
        batchLimitLabel="Free plan · Up to 5 images per batch."
        context={selectionContext()}
        createDraft={createDraft}
        maxImagesPerBatch={5}
        onCancel={onCancel}
        onProcess={onProcess}
      />,
    );

    expect(
      await screen.findByRole("dialog", { name: "Choose photos" }),
    ).toBeVisible();
    expect(screen.getByText("New studio version")).toBeVisible();
    expect(screen.getByRole("img", { name: "Step 1 of 3" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Include front.jpg" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Include side.jpg" })).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Continue to customize →" }));
    expect(screen.getByRole("button", { name: "Premium White" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Dark Studio" }));
    fireEvent.click(screen.getByRole("button", { name: "Plain background" }));
    fireEvent.click(screen.getByRole("button", { name: "Review batch →" }));
    expect(screen.getByRole("heading", { name: "2024 BMW X1" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Process Photos" }));

    await waitFor(() => expect(onProcess).toHaveBeenCalledOnce());
    expect(onProcess).toHaveBeenCalledWith(
      {
        assetIds: ["331a1e25-b9d8-4b1a-a398-8351a58f8c24", SECOND_ASSET_ID],
        options: expect.objectContaining({ background: "DARK_STUDIO", floor: "PLAIN" }),
        vehicleId: VEHICLE_ID,
      },
      expect.any(String),
    );
    expect(createDraft).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("restores a failed batch's selection and treatment for Re-process", async () => {
    const onProcess = vi.fn(async () => undefined);
    render(
      <VehicleCreateDialog
        batchLimitLabel="Free plan · Up to 5 images per batch."
        context={failedSelectionContext("REPROCESS_FAILED")}
        maxImagesPerBatch={5}
        onProcess={onProcess}
      />,
    );

    expect(await screen.findByText("Re-process failed images")).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Include front.jpg" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Include side.jpg" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Include rear.jpg" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Continue to customize →" }));
    fireEvent.click(screen.getByRole("button", { name: "Review batch →" }));
    fireEvent.click(screen.getByRole("button", { name: "Process Photos" }));

    await waitFor(() => expect(onProcess).toHaveBeenCalledOnce());
    expect(onProcess).toHaveBeenCalledWith(
      {
        assetIds: [SECOND_ASSET_ID],
        options: expect.objectContaining({ background: "DARK_STUDIO", floor: "PLAIN" }),
        vehicleId: VEHICLE_ID,
      },
      expect.any(String),
    );
  });

  it("returns to where it was opened from when cancelled", async () => {
    const onCancel = vi.fn();
    render(
      <VehicleCreateDialog
        batchLimitLabel="Free plan · Up to 5 images per batch."
        context={failedSelectionContext("REPLACE_FAILED")}
        maxImagesPerBatch={5}
        onCancel={onCancel}
        onProcess={vi.fn()}
      />,
    );

    expect(await screen.findByText("Replace failed images")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(useVehicleCreateStore.getState().mode).toBe("NEW_UPLOAD");
  });

  it("keeps the person's choices when the page hands over a fresh context", async () => {
    const { rerender } = render(
      <VehicleCreateDialog
        batchLimitLabel="Free plan · Up to 5 images per batch."
        context={selectionContext()}
        maxImagesPerBatch={5}
        onProcess={vi.fn()}
      />,
    );
    const front = await screen.findByRole("checkbox", { name: "Include front.jpg" });
    fireEvent.click(front);

    rerender(
      <VehicleCreateDialog
        batchLimitLabel="Free plan · Up to 5 images per batch."
        context={selectionContext()}
        maxImagesPerBatch={5}
        onProcess={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Include front.jpg" })).not.toBeChecked();
  });
});
