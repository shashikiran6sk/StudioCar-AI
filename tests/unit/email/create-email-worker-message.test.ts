import { describe, expect, it } from "vitest";

import { createEmailWorkerMessage } from "../../../packages/email/src/create-email-worker-message";

describe("createEmailWorkerMessage", () => {
  it("builds the stable message from a persisted snapshot", () => {
    expect(
      createEmailWorkerMessage(
        {
          id: "4bb7fa89-c907-4458-9786-8aafc2235728",
          recipient: "dealer@example.com",
          vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
          vehicleName: "Vehicle one",
        },
        "https://app.studiocar.example/base/path",
      ),
    ).toEqual({
      data: {
        portfolioUrl:
          "https://app.studiocar.example/inventory/0e879f46-1193-4d77-b785-057fe026d998",
        vehicleName: "Vehicle one",
      },
      messageId: "4bb7fa89-c907-4458-9786-8aafc2235728",
      recipient: "dealer@example.com",
      type: "PROCESSING_COMPLETED",
      version: 1,
    });
  });
});
