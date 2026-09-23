import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";
import { PhotoSource } from "../../../../apps/web/src/features/vehicle-create/photo-source";
import { VehicleCreateStep } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-step";
import {
  FIRST_ASSET_ID,
  SECOND_ASSET_ID,
  THIRD_ASSET_ID,
  VEHICLE_ID,
  failedSelectionContext,
  selectionContext,
  uploadedPhoto,
} from "./studio-selection-test-data";

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
    useVehicleCreateStore.getState().addPhotos([
      uploadedPhoto({ clientId: "first", previewUrl: "blob:first" }),
      uploadedPhoto({ clientId: "second", previewUrl: "blob:second" }),
    ]);

    useVehicleCreateStore.getState().movePhoto("second", -1);
    useVehicleCreateStore.getState().removePhoto("first");

    expect(
      useVehicleCreateStore.getState().photos.map((photo) => photo.clientId),
    ).toEqual(["second"]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
  });

  it("opens on an existing vehicle's photos with its previous treatment", () => {
    useVehicleCreateStore.getState().initialize(selectionContext());

    const state = useVehicleCreateStore.getState();
    expect(state).toMatchObject({
      details: { brand: "BMW", model: "X1", name: "2024 BMW X1", year: "2024" },
      mode: "CREATE_VARIANT",
      options: { background: "PREMIUM_WHITE", floor: "HORIZON" },
      step: VehicleCreateStep.Photos,
      vehicleId: VEHICLE_ID,
    });
    expect(
      state.photos.map((photo) => [photo.assetId, photo.selected, photo.source]),
    ).toEqual([
      [FIRST_ASSET_ID, true, PhotoSource.Existing],
      [SECOND_ASSET_ID, true, PhotoSource.Existing],
    ]);
  });

  it("restores a failed batch with only its usable failed photos selected", () => {
    useVehicleCreateStore
      .getState()
      .initialize(failedSelectionContext("REPROCESS_FAILED"));

    const state = useVehicleCreateStore.getState();
    expect(state.mode).toBe("REPROCESS_FAILED");
    expect(state.options).toMatchObject({ background: "DARK_STUDIO", floor: "PLAIN" });
    expect(
      state.photos.map((photo) => ({
        assetId: photo.assetId,
        failureReason: photo.failureReason,
        selected: photo.selected,
      })),
    ).toEqual([
      { assetId: FIRST_ASSET_ID, failureReason: null, selected: false },
      {
        assetId: SECOND_ASSET_ID,
        failureReason: "SERVICE_UNAVAILABLE",
        selected: true,
      },
      { assetId: THIRD_ASSET_ID, failureReason: "UNUSABLE_IMAGE", selected: false },
    ]);
  });

  it("lets a photo be selected or left out, except one that must be replaced", () => {
    useVehicleCreateStore
      .getState()
      .initialize(failedSelectionContext("REPLACE_FAILED"));

    useVehicleCreateStore.getState().togglePhotoSelected(FIRST_ASSET_ID);
    useVehicleCreateStore.getState().togglePhotoSelected(THIRD_ASSET_ID);

    expect(
      useVehicleCreateStore
        .getState()
        .photos.map((photo) => photo.selected),
    ).toEqual([true, true, false]);
  });

  it("puts a replacement in the failed photo's place without freeing a signed URL", () => {
    useVehicleCreateStore
      .getState()
      .initialize(failedSelectionContext("REPLACE_FAILED"));

    useVehicleCreateStore.getState().replacePhoto(
      THIRD_ASSET_ID,
      uploadedPhoto({
        assetId: null,
        clientId: "replacement",
        previewUrl: "blob:replacement",
      }),
    );

    expect(
      useVehicleCreateStore.getState().photos.map((photo) => photo.clientId),
    ).toEqual([FIRST_ASSET_ID, SECOND_ASSET_ID, "replacement"]);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("ignores a replacement for a photo that is no longer listed", () => {
    useVehicleCreateStore.getState().initialize(selectionContext());
    const before = useVehicleCreateStore.getState().photos;

    useVehicleCreateStore
      .getState()
      .replacePhoto("missing", uploadedPhoto({ clientId: "replacement" }));

    expect(useVehicleCreateStore.getState().photos).toBe(before);
  });

  it("returns to a new upload when reset after opening on a vehicle", () => {
    useVehicleCreateStore.getState().initialize(selectionContext());
    useVehicleCreateStore.getState().reset();

    expect(useVehicleCreateStore.getState()).toMatchObject({
      mode: "NEW_UPLOAD",
      photos: [],
      step: VehicleCreateStep.Details,
      vehicleId: null,
    });
  });
});
