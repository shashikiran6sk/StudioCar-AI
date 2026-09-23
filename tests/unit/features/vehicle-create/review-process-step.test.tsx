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
    expect(onProcess).toHaveBeenCalledWith({
      assetIds: ["331a1e25-b9d8-4b1a-a398-8351a58f8c24"],
      options: expect.objectContaining({
        background: "PREMIUM_WHITE",
        enhancement: true,
        platePrivacy: true,
      }),
      vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
    });
    expect(screen.getByText("Maintained")).toBeVisible();
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
    expect(onProcess).toHaveBeenCalledWith({
      assetIds: [SECOND_ASSET_ID],
      options: expect.objectContaining({ background: "PREMIUM_WHITE" }),
      vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
    });
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
    expect(onProcess).toHaveBeenCalledWith({
      assetIds: [FIRST_ASSET_ID],
      options: expect.any(Object),
      vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
    });
  });

  it("submits a typed reference label, trimmed, and leaves a blank one out", async () => {
    act(() => {
      const state = useVehicleCreateStore.getState();
      state.setDraft("0e879f46-1193-4d77-b785-057fe026d998");
      state.addPhotos([uploadedPhoto()]);
    });
    const onProcess = vi.fn(async () => undefined);
    const { unmount } = render(
      <ReviewProcessStep onBack={vi.fn()} onProcess={onProcess} />,
    );

    const label = screen.getByRole("textbox", { name: "Reference label (optional)" });
    expect(label).toHaveAccessibleDescription(
      "Shown with this version in the portfolio, such as a test ID. It never changes the images.",
    );
    fireEvent.change(label, { target: { value: "  T02-S04 | Plate OFF  " } });
    fireEvent.click(screen.getByRole("button", { name: "Process Photos" }));
    await waitFor(() => expect(onProcess).toHaveBeenCalledOnce());
    expect(onProcess).toHaveBeenCalledWith(
      expect.objectContaining({ label: "T02-S04 | Plate OFF" }),
    );

    unmount();
    act(() => useVehicleCreateStore.getState().setBatchLabel("   "));
    render(<ReviewProcessStep onBack={vi.fn()} onProcess={onProcess} />);
    fireEvent.click(screen.getByRole("button", { name: "Process Photos" }));
    await waitFor(() => expect(onProcess).toHaveBeenCalledTimes(2));
    expect(onProcess).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ label: expect.anything() }),
    );
  });
});
