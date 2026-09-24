import { describe, expect, it } from "vitest";

import { EmailWorkerMessageSchema } from "../../../packages/contracts/src/email";

describe("EmailWorkerMessageSchema", () => {
  it("accepts the stable processing-completed message", () => {
    expect(
      EmailWorkerMessageSchema.safeParse({
        data: {
          portfolioUrl: "https://studiocar.example/inventory/vehicle-1",
          vehicleName: "2026 BMW 3 Series",
        },
        messageId: "4bb7fa89-c907-4458-9786-8aafc2235728",
        recipient: "dealer@example.com",
        type: "PROCESSING_COMPLETED",
        version: 1,
      }).success,
    ).toBe(true);
  });

  it("rejects arbitrary message kinds and invalid recipients", () => {
    expect(
      EmailWorkerMessageSchema.safeParse({
        data: {},
        messageId: "4bb7fa89-c907-4458-9786-8aafc2235728",
        recipient: "not-an-email",
        type: "ARBITRARY_HTML",
        version: 1,
      }).success,
    ).toBe(false);
  });

  it("rejects non-HTTP portfolio links", () => {
    expect(
      EmailWorkerMessageSchema.safeParse({
        data: {
          portfolioUrl: "javascript:alert(1)",
          vehicleName: "Vehicle one",
        },
        messageId: "4bb7fa89-c907-4458-9786-8aafc2235728",
        recipient: "dealer@example.com",
        type: "PROCESSING_COMPLETED",
        version: 1,
      }).success,
    ).toBe(false);
  });

  it("accepts the Local and Development application origin", () => {
    expect(
      EmailWorkerMessageSchema.safeParse({
        data: {
          portfolioUrl: "http://localhost:3000/inventory/vehicle-1",
          vehicleName: "Vehicle one",
        },
        messageId: "4bb7fa89-c907-4458-9786-8aafc2235728",
        recipient: "developer@studiocar.local",
        type: "PROCESSING_COMPLETED",
        version: 1,
      }).success,
    ).toBe(true);
  });

  it("rejects other URL schemes that carry a host", () => {
    expect(
      EmailWorkerMessageSchema.safeParse({
        data: {
          portfolioUrl: "ftp://studiocar.example/inventory/vehicle-1",
          vehicleName: "Vehicle one",
        },
        messageId: "4bb7fa89-c907-4458-9786-8aafc2235728",
        recipient: "dealer@example.com",
        type: "PROCESSING_COMPLETED",
        version: 1,
      }).success,
    ).toBe(false);
  });
});
