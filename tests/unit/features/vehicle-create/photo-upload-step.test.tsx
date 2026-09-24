import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PhotoUploadStep } from "../../../../apps/web/src/features/vehicle-create/photo-upload-step";
import type { uploadPhoto } from "../../../../apps/web/src/features/vehicle-create/upload-photo";
import { PhotoUploadStatus } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";
import {
  FIRST_ASSET_ID,
  SECOND_ASSET_ID,
  THIRD_ASSET_ID,
  failedSelectionContext,
  selectionContext,
} from "./studio-selection-test-data";

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
        if (photo.filename === "rear.jpg") {
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
    expect(useVehicleCreateStore.getState().photos[0]?.filename).toBe(
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

  it("shows one batch-limit message beside file-specific validation", async () => {
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
    const validFiles = Array.from({ length: 6 }, (_, index) =>
      new File(["image"], `image-${String(index + 1)}.jpg`, {
        type: "image/jpeg",
      }),
    );

    fireEvent.change(screen.getByLabelText("Select photos"), {
      target: {
        files: [
          ...validFiles,
          new File(["text"], "notes.txt", { type: "text/plain" }),
        ],
      },
    });

    expect(
      screen.getAllByText(
        "You can upload up to 5 images per batch. 1 image was not added.",
      ),
    ).toHaveLength(1);
    expect(screen.getByText(/notes\.txt:/)).toHaveTextContent(
      "Only JPG, JPEG, PNG, and WEBP images are supported.",
    );
    expect(
      screen.queryByText(/image-6\.jpg:.*image limit/i),
    ).not.toBeInTheDocument();
    expect(useVehicleCreateStore.getState().photos).toHaveLength(5);
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(5));
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

  it("lets an existing vehicle's photos be kept or left out", () => {
    act(() => useVehicleCreateStore.getState().initialize(selectionContext()));
    const onContinue = vi.fn();
    const onBack = vi.fn();
    render(
      <PhotoUploadStep
        limitLabel="Free plan · Up to 5 images per batch."
        maximumPhotos={5}
        note="These are the photos of the version you started from."
        onBack={onBack}
        onContinue={onContinue}
        upload={vi.fn()}
      />,
    );

    expect(
      screen.getByText("These are the photos of the version you started from."),
    ).toBeVisible();
    expect(screen.getByText("Image 1 · front.jpg")).toBeVisible();
    fireEvent.click(screen.getByRole("checkbox", { name: "Include front.jpg" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Include side.jpg" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to customize →" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Select at least one photo to process.",
    );
    expect(onContinue).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("checkbox", { name: "Include side.jpg" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to customize →" }),
    );
    expect(onContinue).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("stops at the plan's batch limit counting only selected photos", () => {
    act(() => useVehicleCreateStore.getState().initialize(selectionContext()));
    const onContinue = vi.fn();
    render(
      <PhotoUploadStep
        limitLabel="Free plan · Up to 1 image per batch."
        maximumPhotos={1}
        onBack={vi.fn()}
        onContinue={onContinue}
        upload={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Continue to customize →" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Select up to 1 photos for one batch.",
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Include front.jpg" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to customize →" }),
    );
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("marks failed photos and uploads a replacement in the failed photo's place", async () => {
    act(() =>
      useVehicleCreateStore
        .getState()
        .initialize(failedSelectionContext("REPLACE_FAILED")),
    );
    const upload = vi.fn<typeof uploadPhoto>(async () => ({
      assetId: "664d4158-ec0b-4e4d-96cb-b684d8b1bf57",
      height: 1080,
      width: 1920,
    }));
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

    expect(screen.getByText(/couldn't be read/)).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Include rear.jpg" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Replace image front.jpg" }))
      .not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Replace image rear.jpg" }));
    fireEvent.change(screen.getByLabelText("Choose a replacement photo"), {
      target: {
        files: [new File(["new"], "rear-retake.jpg", { type: "image/jpeg" })],
      },
    });

    await waitFor(() =>
      expect(upload).toHaveBeenCalledWith(
        "0e879f46-1193-4d77-b785-057fe026d998",
        expect.objectContaining({ filename: "rear-retake.jpg" }),
        expect.any(Object),
      ),
    );
    await screen.findByText("Image 3 · rear-retake.jpg");
    const photos = useVehicleCreateStore.getState().photos;
    expect(photos.map((photo) => photo.assetId)).toEqual([
      FIRST_ASSET_ID,
      SECOND_ASSET_ID,
      "664d4158-ec0b-4e4d-96cb-b684d8b1bf57",
    ]);
    expect(photos.some((photo) => photo.assetId === THIRD_ASSET_ID)).toBe(false);
    expect(photos[2]).toMatchObject({ failureReason: null, selected: true });

    fireEvent.click(
      screen.getByRole("button", { name: "Continue to customize →" }),
    );
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("rejects an unsupported replacement and keeps the failed photo", () => {
    act(() =>
      useVehicleCreateStore
        .getState()
        .initialize(failedSelectionContext("REPLACE_FAILED")),
    );
    const upload = vi.fn<typeof uploadPhoto>();
    render(
      <PhotoUploadStep
        limitLabel="Free plan · Up to 5 images per batch."
        maximumPhotos={5}
        onBack={vi.fn()}
        onContinue={vi.fn()}
        upload={upload}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Replace image rear.jpg" }));
    fireEvent.change(screen.getByLabelText("Choose a replacement photo"), {
      target: { files: [new File(["x"], "notes.txt", { type: "text/plain" })] },
    });

    expect(screen.getByText(/notes\.txt:/)).toBeVisible();
    expect(upload).not.toHaveBeenCalled();
    expect(
      useVehicleCreateStore.getState().photos.map((photo) => photo.assetId),
    ).toContain(THIRD_ASSET_ID);
  });
});
