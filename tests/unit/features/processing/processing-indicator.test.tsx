import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProcessingIndicator } from "../../../../apps/web/src/features/processing/processing-indicator";
import { useProcessingStatusStore } from "../../../../apps/web/src/features/processing/processing-status-store";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

vi.mock(
  "../../../../apps/web/src/features/processing/processing-status-poller",
  () => ({ ProcessingStatusPoller: () => null }),
);

const JOB_ID = "8c879f46-1193-4d77-b785-057fe026d111";
const ASSET_ID = "331a1e25-b9d8-4b1a-a398-8351a58f8c24";

describe("ProcessingIndicator", () => {
  beforeEach(() => {
    refresh.mockClear();
    useProcessingStatusStore.setState({ error: null, jobs: {} });
  });

  it("shows active stage details without fabricated progress", () => {
    useProcessingStatusStore.getState().register([
      { jobId: JOB_ID, assetId: ASSET_ID, state: "QUEUED" },
    ]);
    render(<ProcessingIndicator />);

    expect(screen.getByRole("button", { name: "Image processing activity" })).toHaveTextContent(
      "1 image processing",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Image processing activity" }),
    );
    expect(screen.getByText("Preparing image")).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("presents terminal failure and lets the user dismiss it", () => {
    useProcessingStatusStore.getState().register([
      { jobId: JOB_ID, assetId: ASSET_ID, state: "QUEUED" },
    ]);
    act(() => {
      useProcessingStatusStore.getState().update([
        {
          jobId: JOB_ID,
          assetId: ASSET_ID,
          vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
          vehicleName: "2024 Audi Q5",
          updatedAt: "2026-09-19T10:00:00.000Z",
          state: "FAILED",
          stage: "REMOVING_BACKGROUND",
          errorCode: "PROVIDER_5XX",
          retryable: true,
        },
      ]);
    });
    render(<ProcessingIndicator />);

    expect(screen.getByRole("button", { name: "Image processing activity" })).toHaveTextContent(
      "1 image needs attention",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Image processing activity" }),
    );
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Dismiss 2024 Audi Q5/ }));
    expect(
      screen.queryByRole("button", { name: "Image processing activity" }),
    ).not.toBeInTheDocument();
  });
  function completedStatus(jobId: string) {
    return {
      jobId,
      assetId: ASSET_ID,
      vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
      vehicleName: "2024 Audi Q5",
      updatedAt: "2026-09-19T10:00:00.000Z",
      state: "COMPLETED" as const,
      stage: "COMPLETE" as const,
      processedAssetId: "5a879f46-1193-4d77-b785-057fe026d555",
    };
  }

  it("refreshes the page when a job finishes, so its card stops saying 0%", () => {
    useProcessingStatusStore.getState().register([
      { jobId: JOB_ID, assetId: ASSET_ID, state: "QUEUED" },
    ]);
    render(<ProcessingIndicator />);
    expect(refresh).not.toHaveBeenCalled();

    act(() => {
      useProcessingStatusStore.getState().update([completedStatus(JOB_ID)]);
    });

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("says the images are ready rather than that none need attention", () => {
    useProcessingStatusStore.getState().register([
      { jobId: JOB_ID, assetId: ASSET_ID, state: "QUEUED" },
    ]);
    act(() => {
      useProcessingStatusStore.getState().update([completedStatus(JOB_ID)]);
    });
    render(<ProcessingIndicator />);

    const trigger = screen.getByRole("button", {
      name: "Image processing activity",
    });
    expect(trigger).toHaveTextContent("1 image ready");
    expect(trigger).not.toHaveTextContent("attention");
  });

  it("shows a generic message and refreshes when provider credits end processing", () => {
    useProcessingStatusStore
      .getState()
      .register([{ jobId: JOB_ID, assetId: ASSET_ID, state: "QUEUED" }]);
    render(<ProcessingIndicator />);
    act(() =>
      useProcessingStatusStore
        .getState()
        .update([
          {
            jobId: JOB_ID,
            assetId: ASSET_ID,
            vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
            vehicleName: "Credit failure vehicle",
            updatedAt: "2026-09-26T10:00:00.000Z",
            state: "FAILED",
            stage: "REMOVING_BACKGROUND",
            errorCode: "PROVIDER_PAYMENT_REQUIRED",
            retryable: false,
          },
        ]),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
    const trigger = screen.getByRole("button", {
      name: "Image processing activity",
    });
    expect(trigger).toHaveTextContent("needs attention");
    fireEvent.click(trigger);
    expect(
      screen.getByText(
        "The studio image couldn't be created. Re-process to try again.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByText(/remove.bg|PAYMENT_REQUIRED|credits/i),
    ).not.toBeInTheDocument();
  });

});
