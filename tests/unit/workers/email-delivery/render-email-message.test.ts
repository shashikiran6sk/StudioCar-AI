import { describe, expect, it } from "vitest";

import { renderEmailMessage } from "../../../../workers/email-delivery/src/render-email-message";

describe("renderEmailMessage", () => {
  it("renders a fixed template and preserves the message idempotency key", () => {
    const mail = renderEmailMessage({
      data: {
        portfolioUrl: "https://studiocar.example/inventory/vehicle-1",
        vehicleName: "<Dealer vehicle>",
      },
      messageId: "4bb7fa89-c907-4458-9786-8aafc2235728",
      recipient: "dealer@example.com",
      type: "PROCESSING_COMPLETED",
      version: 1,
    });

    expect(mail.idempotencyKey).toBe("4bb7fa89-c907-4458-9786-8aafc2235728");
    expect(mail.html).toContain("&lt;Dealer vehicle&gt;");
    expect(mail.html).not.toContain("<Dealer vehicle>");
  });
});
