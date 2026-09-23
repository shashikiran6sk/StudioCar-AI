import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProcessingBatchRequestError } from "../../../../apps/web/src/features/vehicle-create/processing-batch-request-error";
import { ReviewProcessStep } from "../../../../apps/web/src/features/vehicle-create/review-process-step";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";
import {
  FIRST_ASSET_ID,
  SECOND_ASSET_ID,
  selectionContext,
  uploadedPhoto,
} from "./studio-selection-test-data";

describe("ReviewProcessStep", () => {
  afterEach(() => act(() => useVehicleCreateStore.getState().reset()));

  it("shows the authoritative batch summary and submits normalized options", async () => {
    act(() => {
      const state = useVehicleCreateStore.getState();
      state.setDetailsField("name", "2022 BMW 3 Series");
      state.setDetailsField("brand", "BMW");
      state.setDetailsField("model", "3 Series");
      state.setDraft("0e879f46-1193-4d77-b785-057fe026d998");
      state.addPhotos([uploadedPhoto()]);
    });
    const onProcess = vi.fn(async () => undefined);
    render(<ReviewProcessStep onBack={vi.fn()} onProcess={onProcess} />);

    expect(screen.getByRole("heading", { name: "2022 BMW 3 Series" })).toBeVisible();
    expect(screen.getByText("1 photo")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Process Photos" }));

    await waitFor(() => expect(onProcess).toHaveBeenCalledOnce());
    expect(onProcess).toHaveBeenCalledWith(
      "0e879f46-1193-4d77-b785-057fe026d998",
      ["331a1e25-b9d8-4b1a-a398-8351a58f8c24"],
      expect.objectContaining({
        background: "PREMIUM_WHITE",
        enhancement: true,
        platePrivacy: true,
      }),
    );
  });

  it("announces a processing-command failure without losing the draft", async () => {
    act(() => {
      const state = useVehicleCreateStore.getState();
      state.setDraft("0e879f46-1193-4d77-b785-057fe026d998");
      state.addPhotos([uploadedPhoto()]);
    });
    render(
      <ReviewProcessStep
        onBack={vi.fn()}
        onProcess={vi.fn(async () => {
          throw new Error("unavailable");
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Process Photos" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Processing could not be started.",
    );
    expect(screen.queryByText("unavailable")).not.toBeInTheDocument();
    expect(useVehicleCreateStore.getState().vehicleId).not.toBeNull();
  });

  it("shows the reason the processing endpoint gave for a refusal", async () => {
    act(() => {
      const state = useVehicleCreateStore.getState();
      state.setDraft("0e879f46-1193-4d77-b785-057fe026d998");
      state.addPhotos([uploadedPhoto()]);
    });
    render(
      <ReviewProcessStep
        onBack={vi.fn()}
        onProcess={vi.fn(async () => {
          throw new ProcessingBatchRequestError(
            "This vehicle is still processing another batch.",
          );
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Process Photos" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This vehicle is still processing another batch.",
    );
  });

  it("submits only the selected photos of an existing vehicle", async () => {
    act(() => {
      const state = useVehicleCreateStore.getState();
      state.initialize(selectionContext());
      state.togglePhotoSelected(FIRST_ASSET_ID);
    });
    const onProcess = vi.fn(async () => undefined);
    render(<ReviewProcessStep onBack={vi.fn()} onProcess={onProcess} />);

    expect(screen.getByRole("heading", { name: "2024 BMW X1" })).toBeVisible();
    expect(screen.getByText("1 photo")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Process Photos" }));

    await waitFor(() => expect(onProcess).toHaveBeenCalledOnce());
    expect(onProcess).toHaveBeenCalledWith(
      "0e879f46-1193-4d77-b785-057fe026d998",
      [SECOND_ASSET_ID],
      expect.objectContaining({ background: "PREMIUM_WHITE" }),
    );
  });

  it("submits once however quickly Process is clicked again", async () => {
    act(() => {
      const state = useVehicleCreateStore.getState();
      state.setDraft("0e879f46-1193-4d77-b785-057fe026d998");
      state.addPhotos([uploadedPhoto()]);
    });
    let finish: () => void = () => undefined;
    const onProcess = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<ReviewProcessStep onBack={vi.fn()} onProcess={onProcess} />);
    const process = screen.getByRole("button", { name: "Process Photos" });

    fireEvent.click(process);
    fireEvent.click(process);
    fireEvent.click(process);

    expect(onProcess).toHaveBeenCalledOnce();
    expect(await screen.findByRole("button", { name: "Starting…" })).toBeDisabled();
    await act(async () => {
      finish();
      await Promise.resolve();
    });
    expect(onProcess).toHaveBeenCalledWith(
      "0e879f46-1193-4d77-b785-057fe026d998",
      [FIRST_ASSET_ID],
      expect.any(Object),
    );
  });
});
