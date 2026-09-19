import { afterEach, describe, expect, it } from "vitest";

import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";

describe("useVehicleCreateStore", () => {
  afterEach(() => useVehicleCreateStore.getState().reset());

  it("keeps transient details while advancing to the persisted draft", () => {
    const state = useVehicleCreateStore.getState();
    state.setDetailsField("name", "Porsche 911 Carrera");
    state.setDraft("0e879f46-1193-4d77-b785-057fe026d998");

    expect(useVehicleCreateStore.getState()).toMatchObject({
      details: { name: "Porsche 911 Carrera" },
      step: 2,
      vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
    });
  });

  it("clears wizard state explicitly", () => {
    useVehicleCreateStore.getState().setDetailsField("brand", "Porsche");
    useVehicleCreateStore.getState().reset();

    expect(useVehicleCreateStore.getState()).toMatchObject({
      details: { brand: "", name: "" },
      step: 1,
      vehicleId: null,
    });
  });
});
