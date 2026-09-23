import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StudioSelectionLauncher } from "../../../../apps/web/src/features/vehicle-create/studio-selection-launcher";
import { useProcessingStatusStore } from "../../../../apps/web/src/features/processing/processing-status-store";
import { requestProcessingBatch } from "../../../../apps/web/src/features/vehicle-create/request-processing-batch";
import { useVehicleCreateStore } from "../../../../apps/web/src/features/vehicle-create/vehicle-create-store";
import { failedSelectionContext, VEHICLE_ID } from "./studio-selection-test-data";

const router = { push: vi.fn(), refresh: vi.fn(), replace: vi.fn() };

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock(
  "../../../../apps/web/src/features/vehicle-create/request-processing-batch",
  () => ({ requestProcessingBatch: vi.fn() }),
);

const JOB_ID = "6dd90ca1-e129-467a-b9a8-acc0e445794a";
const PORTFOLIO = `/inventory/${VEHICLE_ID}`;

describe("StudioSelectionLauncher", () => {
  beforeEach(() => {
    vi.mocked(requestProcessingBatch).mockResolvedValue({
      jobs: [
        {
          assetId: "442b2f36-cae9-4c2b-b4a9-9462b69f9d35",
          jobId: JOB_ID,
          state: "QUEUED",
        },
      ],
      replayed: false,
    });
  });

  afterEach(() => {
    useVehicleCreateStore.getState().reset();
    useProcessingStatusStore.setState({ jobs: {} });
    vi.clearAllMocks();
  });

  it("submits through the processing command and follows the new batch", async () => {
    render(
      <StudioSelectionLauncher
        cancelHref={`${PORTFOLIO}?studio=REPROCESS_FAILED`}
        context={failedSelectionContext("REPROCESS_FAILED")}
        successHref={PORTFOLIO}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Continue to customize →" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Review batch →" }));
    fireEvent.click(screen.getByRole("button", { name: "Process Photos" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(PORTFOLIO));
    expect(requestProcessingBatch).toHaveBeenCalledWith(
      {
        assetIds: ["442b2f36-cae9-4c2b-b4a9-9462b69f9d35"],
        options: expect.objectContaining({ background: "DARK_STUDIO" }),
        vehicleId: VEHICLE_ID,
      },
      expect.any(String),
    );
    expect(useProcessingStatusStore.getState().jobs[JOB_ID]).toBeDefined();
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it("returns to the page it was opened from on Cancel", async () => {
    render(
      <StudioSelectionLauncher
        cancelHref="/inventory?mode=CREATE_STUDIO"
        context={failedSelectionContext("REPROCESS_FAILED")}
        successHref={PORTFOLIO}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(router.replace).toHaveBeenCalledWith("/inventory?mode=CREATE_STUDIO");
    expect(requestProcessingBatch).not.toHaveBeenCalled();
  });
});
