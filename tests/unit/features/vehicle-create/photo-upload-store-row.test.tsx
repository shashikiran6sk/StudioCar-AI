import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PhotoUploadStoreRow } from "../../../../apps/web/src/features/vehicle-create/photo-upload-store-row";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";
import { PhotoUploadStatus } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status";
import { uploadedPhoto } from "./studio-selection-test-data";
afterEach(() => { cleanup(); useVehicleCreateStore.getState().reset(); vi.restoreAllMocks(); });
it("routes row actions by stable ID and tolerates removal from the store", () => {
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  useVehicleCreateStore.getState().addPhotos([uploadedPhoto({ clientId: "photo", filename: "front.jpg", status: PhotoUploadStatus.Failed })]);
  const remove = vi.fn(); const retry = vi.fn();
  render(<PhotoUploadStoreRow clientId="photo" index={0} count={1} choosing={false} onRemove={remove} onRetry={retry} onReplace={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove front.jpg" }));
  expect(retry).toHaveBeenCalledWith("photo"); expect(remove).toHaveBeenCalledWith("photo");
  act(() => useVehicleCreateStore.getState().removePhoto("photo"));
  expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
});
