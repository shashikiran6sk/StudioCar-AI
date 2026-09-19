import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PhotoUploadItemRow } from "../../../../apps/web/src/features/vehicle-create/photo-upload-item-row";
import { PhotoUploadStatus } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status";

describe("PhotoUploadItemRow", () => {
  it("exposes status, recovery, removal, and accessible reorder controls", () => {
    const file = new File(["image"], "vehicle.jpg", { type: "image/jpeg" });
    render(
      <PhotoUploadItemRow
        canMoveDown={false}
        canMoveUp
        onMoveDown={vi.fn()}
        onMoveUp={vi.fn()}
        onRemove={vi.fn()}
        onRetry={vi.fn()}
        photo={{
          assetId: null,
          clientId: "photo-1",
          error: "Network interrupted.",
          file,
          height: null,
          previewUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
          progress: 50,
          status: PhotoUploadStatus.Failed,
          width: null,
        }}
      />,
    );

    expect(screen.getByText("Upload failed")).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Move up vehicle.jpg" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Move down vehicle.jpg" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove vehicle.jpg" })).toBeEnabled();
  });
});
