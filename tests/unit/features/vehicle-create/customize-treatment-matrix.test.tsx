import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CreateProcessingBatch } from "../../../../packages/contracts/src/jobs";
import { CustomizeTreatmentStep } from "../../../../apps/web/src/features/vehicle-create/customize-treatment-step";
import { ReviewProcessStep } from "../../../../apps/web/src/features/vehicle-create/review-process-step";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";
import {
  TREATMENT_MATRIX_SIZE,
  createTreatmentMatrix,
  type TreatmentCase,
  type TreatmentToggles,
} from "../../../support/studio-treatment-matrix";
import { uploadedPhoto } from "./studio-selection-test-data";

const VEHICLE_ID = "0e879f46-1193-4d77-b785-057fe026d998";
const ASSET_ID = "331a1e25-b9d8-4b1a-a398-8351a58f8c24";

const SWITCH_NAMES = {
  enhancement: "Image Enhancement",
  maintainComposition: "Maintain Composition",
  platePrivacy: "Hide Number Plate",
  studioBackground: "Studio Background",
} satisfies Record<keyof TreatmentToggles, string>;

const BACKGROUND_NAMES = {
  DARK_STUDIO: "Dark Studio",
  GREY_STUDIO: "Grey Studio",
  PREMIUM_WHITE: "Premium White",
} satisfies Record<TreatmentCase["studio"]["background"], string>;

const FLOOR_NAMES = {
  HORIZON: "Standard floor",
  PLAIN: "Plain background",
} satisfies Record<TreatmentCase["studio"]["floor"], string>;

function setSwitch(name: string, wanted: boolean) {
  const control = screen.getByRole("switch", { name });
  if (control.getAttribute("aria-checked") !== String(wanted)) {
    fireEvent.click(control);
  }
  expect(control).toHaveAttribute("aria-checked", String(wanted));
}

/**
 * Chooses a case the way a person would: background and floor first, while
 * they can be chosen, then the four switches.
 */
function chooseTreatment({ studio, toggles }: TreatmentCase) {
  render(<CustomizeTreatmentStep onBack={vi.fn()} onContinue={vi.fn()} />);
  fireEvent.click(
    screen.getByRole("button", { name: BACKGROUND_NAMES[studio.background] }),
  );
  fireEvent.click(screen.getByRole("button", { name: FLOOR_NAMES[studio.floor] }));
  setSwitch(SWITCH_NAMES.platePrivacy, toggles.platePrivacy);
  setSwitch(SWITCH_NAMES.enhancement, toggles.enhancement);
  setSwitch(SWITCH_NAMES.studioBackground, toggles.studioBackground);
  setSwitch(SWITCH_NAMES.maintainComposition, toggles.maintainComposition);

  // Background and floor can only be chosen with a studio background.
  for (const name of [
    ...Object.values(BACKGROUND_NAMES),
    ...Object.values(FLOOR_NAMES),
  ]) {
    const choice = screen.getByRole("button", { name });
    if (toggles.studioBackground) expect(choice).toBeEnabled();
    else expect(choice).toBeDisabled();
  }
  cleanup();
}

async function submitReview(label: string): Promise<CreateProcessingBatch> {
  const onProcess = vi.fn(async (_command: CreateProcessingBatch) => undefined);
  render(<ReviewProcessStep onBack={vi.fn()} onProcess={onProcess} />);
  fireEvent.change(
    screen.getByRole("textbox", { name: "Reference label (optional)" }),
    { target: { value: label } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Process Photos" }));
  await waitFor(() => expect(onProcess).toHaveBeenCalledOnce());
  cleanup();
  const command = onProcess.mock.calls[0]?.[0];
  if (!command) throw new Error("Expected a processing command.");
  return command;
}

describe("Customize treatment across the 96-case matrix", () => {
  afterEach(() => act(() => useVehicleCreateStore.getState().reset()));

  const cases = createTreatmentMatrix();

  it("generates every case", () => {
    expect(cases).toHaveLength(TREATMENT_MATRIX_SIZE);
  });

  it.each(cases)("$id submits exactly its treatment", async (testCase) => {
    act(() => {
      const state = useVehicleCreateStore.getState();
      state.setDraft(VEHICLE_ID);
      state.addPhotos([uploadedPhoto()]);
    });

    chooseTreatment(testCase);
    expect(useVehicleCreateStore.getState().options).toEqual(testCase.options);

    await expect(submitReview(testCase.label)).resolves.toEqual({
      assetIds: [ASSET_ID],
      label: testCase.label,
      options: testCase.options,
      vehicleId: VEHICLE_ID,
    });
  });
});
