import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PhotoUploadStep } from "../../../../apps/web/src/features/vehicle-create/photo-upload-step";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";
import type { uploadPhoto } from "../../../../apps/web/src/features/vehicle-create/upload-photo";
import { PHOTO_UPLOAD_CONCURRENCY } from "../../../../apps/web/src/features/vehicle-create/upload-performance.constants";
beforeEach(() => {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  useVehicleCreateStore.getState().setDraft("vehicle");
});
afterEach(() => { cleanup(); useVehicleCreateStore.getState().reset(); vi.restoreAllMocks(); });
it("bounds a twenty-file batch and never uploads a removed queued file", async () => {
  let active = 0; let peak = 0;
  const finishers: (() => void)[] = [];
  const upload = vi.fn<typeof uploadPhoto>((_vehicle, photo) => new Promise((resolve) => {
    active += 1; peak = Math.max(peak, active);
    finishers.push(() => { active -= 1; resolve({ assetId: photo.clientId, height: 1, width: 1 }); });
  }));
  render(<PhotoUploadStep maximumPhotos={20} limitLabel="20 photos" onBack={vi.fn()} onContinue={vi.fn()} upload={upload} />);
  fireEvent.change(screen.getByLabelText("Select photos"), { target: { files: Array.from({ length: 20 }, (_, i) => new File(["image"], `photo-${String(i)}.jpg`, { type: "image/jpeg" })) } });
  await waitFor(() => expect(upload).toHaveBeenCalledTimes(PHOTO_UPLOAD_CONCURRENCY));
  fireEvent.click(screen.getByRole("button", { name: "Remove photo-10.jpg" }));
  for (let index = 0; index < 19; index += 1) {
    await waitFor(() => expect(finishers[index]).toBeDefined());
    await act(async () => { finishers[index]?.(); });
  }
  expect(peak).toBe(PHOTO_UPLOAD_CONCURRENCY);
  expect(upload).toHaveBeenCalledTimes(19);
  expect(upload.mock.calls.some(([, photo]) => photo.filename === "photo-10.jpg")).toBe(false);
  expect(screen.getAllByText("Uploaded")).toHaveLength(19);
});
it("cancels active and queued work on close and ignores late completion callbacks", async () => {
  const finishers: (() => void)[] = [];
  const upload = vi.fn<typeof uploadPhoto>((_vehicle, photo, callbacks) => new Promise((resolve) => {
    finishers.push(() => { callbacks.onProgress(99); resolve({ assetId: photo.clientId, height: 1, width: 1 }); });
  }));
  const { unmount } = render(<PhotoUploadStep maximumPhotos={20} limitLabel="20 photos" onBack={vi.fn()} onContinue={vi.fn()} upload={upload} />);
  fireEvent.change(screen.getByLabelText("Select photos"), { target: { files: Array.from({ length: 20 }, (_, i) => new File(["image"], `photo-${String(i)}.jpg`, { type: "image/jpeg" })) } });
  await waitFor(() => expect(upload).toHaveBeenCalledTimes(PHOTO_UPLOAD_CONCURRENCY));
  unmount();
  const before = useVehicleCreateStore.getState().photos;
  await act(async () => finishers.forEach((finish) => finish()));
  expect(upload).toHaveBeenCalledTimes(PHOTO_UPLOAD_CONCURRENCY);
  expect(upload.mock.calls.every(([, , callbacks]) => callbacks.signal?.aborted)).toBe(true);
  expect(useVehicleCreateStore.getState().photos).toBe(before);
});
