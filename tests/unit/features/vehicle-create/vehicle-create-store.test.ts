import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";
import type { PhotoUploadItem } from "../../../../apps/web/src/features/vehicle-create/photo-upload.types";
import { PhotoUploadStatus } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status";
import { VehicleCreateStep } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-step";

describe("useVehicleCreateStore", () => {
  beforeEach(() => {
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    useVehicleCreateStore.getState().reset();
    vi.restoreAllMocks();
  });

  it("keeps transient details while advancing to the persisted draft", () => {
    const state = useVehicleCreateStore.getState();
    state.setDetailsField("name", "Porsche 911 Carrera");
    state.setDraft("0e879f46-1193-4d77-b785-057fe026d998");

    expect(useVehicleCreateStore.getState()).toMatchObject({
      details: { name: "Porsche 911 Carrera" },
      step: VehicleCreateStep.Photos,
      vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
    });
  });

  it("clears wizard state explicitly", () => {
    useVehicleCreateStore.getState().setDetailsField("brand", "Porsche");
    useVehicleCreateStore.getState().reset();

    expect(useVehicleCreateStore.getState()).toMatchObject({
      details: { brand: "", name: "" },
      options: {
        background: "PREMIUM_WHITE",
        enhancement: true,
        platePrivacy: true,
      },
      step: VehicleCreateStep.Details,
      vehicleId: null,
    });
  });

  it("reorders and removes only the selected transient photo", () => {
    const firstFile = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const secondFile = new File(["second"], "second.jpg", {
      type: "image/jpeg",
    });
    const base = {
      assetId: null,
      error: null,
      height: null,
      progress: 0,
      status: PhotoUploadStatus.Selected,
      width: null,
    } satisfies Omit<PhotoUploadItem, "clientId" | "file" | "previewUrl">;
    useVehicleCreateStore.getState().addPhotos([
      {
        ...base,
        clientId: "first",
        file: firstFile,
        previewUrl: "blob:first",
      },
      {
        ...base,
        clientId: "second",
        file: secondFile,
        previewUrl: "blob:second",
      },
    ]);

    useVehicleCreateStore.getState().movePhoto("second", -1);
    useVehicleCreateStore.getState().removePhoto("first");

    expect(
      useVehicleCreateStore.getState().photos.map((photo) => photo.clientId),
    ).toEqual(["second"]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
  });
});
