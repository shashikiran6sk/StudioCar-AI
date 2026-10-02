import { Profiler } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PhotoUploadStep } from "../../../../apps/web/src/features/vehicle-create/photo-upload-step";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";
import { uploadedPhoto } from "./studio-selection-test-data";

const measurements = vi.hoisted(() => ({ rows: new Map<string, number>() }));
vi.mock("../../../../apps/web/src/features/vehicle-create/photo-upload-item-row", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../../apps/web/src/features/vehicle-create/photo-upload-item-row")>();
  return { PhotoUploadItemRow: (props: Parameters<typeof original.PhotoUploadItemRow>[0]) => (
    <Profiler id={props.photo.clientId} onRender={(id) => measurements.rows.set(id, (measurements.rows.get(id) ?? 0) + 1)}>
      <original.PhotoUploadItemRow {...props} />
    </Profiler>
  ) };
});
afterEach(() => { cleanup(); useVehicleCreateStore.getState().reset(); vi.restoreAllMocks(); });
it("profiles repeated measured progress on one row in a twenty-photo list", () => {
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  useVehicleCreateStore.getState().addPhotos(Array.from({ length: 20 }, (_, index) => uploadedPhoto({ clientId: String(index), progress: 0 })));
  let commits = 0;
  render(<Profiler id="list" onRender={() => { commits += 1; }}><PhotoUploadStep limitLabel="20 images" maximumPhotos={20} onBack={vi.fn()} onContinue={vi.fn()} /></Profiler>);
  measurements.rows.clear();
  commits = 0;
  for (let percent = 1; percent <= 100; percent += 1) {
    for (let duplicate = 0; duplicate < 2; duplicate += 1) {
      act(() => useVehicleCreateStore.getState().updatePhoto("0", { progress: percent }));
    }
  }
  const rowCommits = [...measurements.rows.values()].reduce((sum, count) => sum + count, 0);
  process.stdout.write(`${JSON.stringify({ commits, rowCommits, changedRow: measurements.rows.get("0"), untouchedRow: measurements.rows.get("1") ?? 0 })}\n`);
  expect(useVehicleCreateStore.getState().photos[0]?.progress).toBe(100);
  expect(commits).toBe(100);
  expect(rowCommits).toBe(100);
  expect(measurements.rows.get("1") ?? 0).toBe(0);
});
