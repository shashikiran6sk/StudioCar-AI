import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PhotoUploadStatus } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status";
import { ReviewProcessStep } from "../../../../apps/web/src/features/vehicle-create/review-process-step";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";

describe("ReviewProcessStep", () => {
  afterEach(() => act(() => useVehicleCreateStore.getState().reset()));

  it("shows the authoritative batch summary and submits normalized options", async () => {
    const file = new File(["image"], "vehicle.jpg", { type: "image/jpeg" });
    act(() => {
      const state = useVehicleCreateStore.getState();
      state.setDetailsField("name", "2022 BMW 3 Series");
      state.setDetailsField("brand", "BMW");
      state.setDetailsField("model", "3 Series");
      state.setDraft("0e879f46-1193-4d77-b785-057fe026d998");
      state.addPhotos([
        {
          assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
          clientId: "photo-1",
          error: null,
          file,
          height: 1080,
          previewUrl: "blob:preview",
          progress: 100,
          status: PhotoUploadStatus.Uploaded,
          width: 1920,
        },
      ]);
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
      state.addPhotos([
        {
          assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
          clientId: "photo-1",
          error: null,
          file: new File(["image"], "vehicle.jpg", { type: "image/jpeg" }),
          height: 1080,
          previewUrl: "blob:preview",
          progress: 100,
          status: PhotoUploadStatus.Uploaded,
          width: 1920,
        },
      ]);
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
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(useVehicleCreateStore.getState().vehicleId).not.toBeNull();
  });
});
