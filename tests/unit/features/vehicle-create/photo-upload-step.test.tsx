import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PhotoUploadStep } from "../../../../apps/web/src/features/vehicle-create/photo-upload-step";
import type { uploadPhoto } from "../../../../apps/web/src/features/vehicle-create/upload-photo";
import { PhotoUploadStatus } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";

describe("PhotoUploadStep", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    act(() => {
      useVehicleCreateStore
        .getState()
        .setDraft("0e879f46-1193-4d77-b785-057fe026d998");
    });
  });

  afterEach(() => {
    act(() => useVehicleCreateStore.getState().reset());
    vi.restoreAllMocks();
  });

  it("preserves successful uploads when a neighboring photo fails", async () => {
    const upload = vi.fn<typeof uploadPhoto>(
      async (_vehicleId, photo, callbacks) => {
        callbacks.onStatus(PhotoUploadStatus.Uploading);
        callbacks.onProgress(60);
        if (photo.file.name === "rear.jpg") {
          throw new Error("Network interrupted.");
        }
        callbacks.onStatus(PhotoUploadStatus.Finalizing);
        return {
          assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
          width: 1920,
          height: 1080,
        };
      },
    );
    const onContinue = vi.fn();
    render(
      <PhotoUploadStep
        limitLabel="Free plan · Up to 5 images per batch."
        maximumPhotos={5}
      onBack={vi.fn()}
        onContinue={onContinue}
        upload={upload}
      />,
    );
    const input = screen.getByLabelText("Select photos");
    const front = new File(["front"], "front.jpg", { type: "image/jpeg" });
    const rear = new File(["rear"], "rear.jpg", { type: "image/jpeg" });

    fireEvent.change(input, { target: { files: [front, rear] } });

    await waitFor(() => {
      expect(screen.getByText("Uploaded")).toBeVisible();
      expect(screen.getByText("Upload failed")).toBeVisible();
    });
    expect(screen.getByText("Network interrupted.")).toBeVisible();
    expect(useVehicleCreateStore.getState().photos).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Remove rear.jpg" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to customize →" }),
    );
    expect(onContinue).toHaveBeenCalledOnce();
    expect(useVehicleCreateStore.getState().photos[0]?.file.name).toBe(
      "front.jpg",
    );
  });

  it("rejects unsupported files without losing a valid selection", async () => {
    const upload = vi.fn<typeof uploadPhoto>(async () => ({
      assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
      width: 1920,
      height: 1080,
    }));
    render(
      <PhotoUploadStep
        limitLabel="Free plan · Up to 5 images per batch."
        maximumPhotos={5}
      onBack={vi.fn()}
        onContinue={vi.fn()}
        upload={upload}
      />,
    );
    fireEvent.change(screen.getByLabelText("Select photos"), {
      target: {
        files: [
          new File(["front"], "front.webp", { type: "image/webp" }),
          new File(["notes"], "notes.txt", { type: "text/plain" }),
        ],
      },
    });

    expect(await screen.findByText(/notes\.txt:/)).toBeVisible();
    expect(screen.getByText("front.webp")).toBeVisible();
    expect(useVehicleCreateStore.getState().photos).toHaveLength(1);
  });

  it("cancels an in-flight upload when its photo is removed", async () => {
    let signal: AbortSignal | undefined;
    const upload = vi.fn<typeof uploadPhoto>(
      (_vehicleId, _photo, callbacks) =>
        new Promise((_resolve, reject) => {
          signal = callbacks.signal;
          callbacks.signal?.addEventListener("abort", () => {
            reject(new DOMException("Upload cancelled.", "AbortError"));
          });
        }),
    );
    render(
      <PhotoUploadStep
        limitLabel="Free plan · Up to 5 images per batch."
        maximumPhotos={5}
      onBack={vi.fn()}
        onContinue={vi.fn()}
        upload={upload}
      />,
    );

    fireEvent.change(screen.getByLabelText("Select photos"), {
      target: {
        files: [new File(["front"], "front.jpg", { type: "image/jpeg" })],
      },
    });
    await waitFor(() => expect(upload).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: "Remove front.jpg" }));

    expect(signal?.aborted).toBe(true);
    expect(useVehicleCreateStore.getState().photos).toHaveLength(0);
  });
  it("shows the limit sentence it is given rather than a stored one", () => {
    render(
      <PhotoUploadStep
        limitLabel="Studio Plus plan · Up to 20 images per batch."
        maximumPhotos={20}
        onBack={vi.fn()}
        onContinue={vi.fn()}
        upload={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Studio Plus plan · Up to 20 images per batch."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Up to 3 images/)).not.toBeInTheDocument();
  });
});
