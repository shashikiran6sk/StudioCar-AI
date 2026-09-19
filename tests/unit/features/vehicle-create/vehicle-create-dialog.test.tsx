import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VehicleCreateDialog } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-dialog";
import type { requestCreateVehicleDraft } from "../../../../apps/web/src/features/vehicle-create/request-create-vehicle-draft";
import type { requestUpdateVehicleDraft } from "../../../../apps/web/src/features/vehicle-create/request-update-vehicle-draft";
import type { uploadPhoto } from "../../../../apps/web/src/features/vehicle-create/upload-photo";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";

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
      "0e879f46-1193-4d77-b785-057fe026d998",
      ["331a1e25-b9d8-4b1a-a398-8351a58f8c24"],
      expect.objectContaining({ background: "DARK_STUDIO" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(useVehicleCreateStore.getState().vehicleId).toBeNull();
  });
});
