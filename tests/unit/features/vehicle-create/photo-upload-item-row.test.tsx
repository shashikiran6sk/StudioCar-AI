import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PhotoSource } from "../../../../apps/web/src/features/vehicle-create/photo-source";
import { PhotoUploadItemRow } from "../../../../apps/web/src/features/vehicle-create/photo-upload-item-row";
import { PhotoUploadStatus } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status";
import { uploadedPhoto } from "./studio-selection-test-data";

const handlers = {
  onMoveDown: vi.fn(),
  onMoveUp: vi.fn(),
  onRemove: vi.fn(),
  onRetry: vi.fn(),
};

describe("PhotoUploadItemRow", () => {
  it("exposes status, recovery, removal, and accessible reorder controls", () => {
    render(
      <PhotoUploadItemRow
        {...handlers}
        canMoveDown={false}
        canMoveUp
        photo={uploadedPhoto({
          assetId: null,
          error: "Network interrupted.",
          previewUrl:
            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
          progress: 50,
          status: PhotoUploadStatus.Failed,
        })}
      />,
    );

    expect(screen.getByText("Upload failed")).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Move up vehicle.jpg" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Move down vehicle.jpg" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove vehicle.jpg" })).toBeEnabled();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("marks a photo that failed processing and offers to replace it", () => {
    const onReplace = vi.fn();
    const onToggleSelected = vi.fn();
    render(
      <PhotoUploadItemRow
        {...handlers}
        canMoveDown
        canMoveUp={false}
        onReplace={onReplace}
        onToggleSelected={onToggleSelected}
        photo={uploadedPhoto({
          failureReason: "SERVICE_UNAVAILABLE",
          file: null,
          filename: "side.jpg",
          source: PhotoSource.Existing,
        })}
        position={3}
      />,
    );

    expect(screen.getByText("Image 3 · side.jpg")).toBeVisible();
    expect(screen.getByText(/Processing failed · Background removal was unavailable/))
      .toBeVisible();
    fireEvent.click(screen.getByRole("checkbox", { name: "Include side.jpg" }));
    expect(onToggleSelected).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Replace image side.jpg" }));
    expect(onReplace).toHaveBeenCalledOnce();
  });

  it("cannot include an original that only a new photo can fix", () => {
    render(
      <PhotoUploadItemRow
        {...handlers}
        canMoveDown
        canMoveUp
        onReplace={vi.fn()}
        onToggleSelected={vi.fn()}
        photo={uploadedPhoto({
          failureReason: "UNUSABLE_IMAGE",
          filename: "rear.jpg",
          replaceRequired: true,
          selected: false,
        })}
        position={1}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Include rear.jpg" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Replace image rear.jpg" })).toBeEnabled();
  });

  it("explains when processing could not detect a car", () => {
    render(
      <PhotoUploadItemRow
        {...handlers}
        canMoveDown
        canMoveUp
        onReplace={vi.fn()}
        onToggleSelected={vi.fn()}
        photo={uploadedPhoto({
          failureReason: "NON_CAR_IMAGE",
          filename: "document.jpg",
          replaceRequired: true,
          selected: false,
        })}
        position={2}
      />,
    );

    expect(
      screen.getByText(
        /A vehicle could not be detected in this image\. Please upload a clear image of a car\./,
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Replace image document.jpg" }),
    ).toBeEnabled();
  });
});
