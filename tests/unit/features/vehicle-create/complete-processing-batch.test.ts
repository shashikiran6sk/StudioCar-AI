import type { ProcessingOptions } from "../../../../packages/contracts/src/processing";
import { describe, expect, it, vi } from "vitest";

import { completeProcessingBatch } from "../../../../apps/web/src/features/vehicle-create/complete-processing-batch";

const VEHICLE_ID = "4bb7fa89-c907-4458-9786-8aafc2235728";
const ASSET_ID = "5cc8fb90-d018-4569-a897-9bbfd3346839";
const JOB_ID = "6dd90ca1-e129-467a-b9a8-acc0e445794a";
const OPTIONS: ProcessingOptions = {
  background: "PREMIUM_WHITE",
  floor: "HORIZON",
  crop: "MAINTAIN_COMPOSITION",
  enhancement: true,
  outputFormat: "JPEG",
  paddingPercent: 8,
  platePrivacy: true,
  quality: 90,
  shadow: "NATURAL",
};

describe("completeProcessingBatch", () => {
  it("submits the command as built, label included, then registers, navigates and refreshes", async () => {
    const calls: string[] = [];
    const request = vi.fn().mockResolvedValue({
      jobs: [{ assetId: ASSET_ID, jobId: JOB_ID, state: "QUEUED" }],
      replayed: false,
    });

    await completeProcessingBatch(
      { assetIds: [ASSET_ID], label: "T02-S04", options: OPTIONS, vehicleId: VEHICLE_ID },
      "processing-idempotency-key",
      {
        navigate: () => calls.push("navigate"),
        refresh: () => calls.push("refresh"),
        register: () => calls.push("register"),
        request,
      },
    );

    expect(request).toHaveBeenCalledWith(
      { assetIds: [ASSET_ID], label: "T02-S04", options: OPTIONS, vehicleId: VEHICLE_ID },
      "processing-idempotency-key",
    );
    expect(calls).toEqual(["register", "navigate", "refresh"]);
  });

  it("keeps the wizard in place when the processing command fails", async () => {
    const navigate = vi.fn();
    const refresh = vi.fn();
    const register = vi.fn();

    await expect(
      completeProcessingBatch(
        { assetIds: [ASSET_ID], options: OPTIONS, vehicleId: VEHICLE_ID },
        "processing-idempotency-key",
        {
          navigate,
          refresh,
          register,
          request: vi.fn().mockRejectedValue(new Error("queue unavailable")),
        },
      ),
    ).rejects.toThrow("queue unavailable");
    expect(register).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
