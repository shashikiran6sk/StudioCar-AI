import { describe, expect, it, vi } from "vitest";

import { requestPhoneOtpWidget } from "../../../../apps/web/src/features/auth/request-phone-otp-widget";

const widget = {
  enabled: true,
  driver: "msg91",
  widgetId: "widget-id",
  tokenAuth: "widget-token",
  devCode: null,
  reason: null,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("requestPhoneOtpWidget", () => {
  it("returns the validated widget configuration", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => jsonResponse(widget));

    await expect(requestPhoneOtpWidget(fetcher)).resolves.toEqual(widget);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/auth/phone/widget",
      expect.objectContaining({ headers: { accept: "application/json" } }),
    );
  });

  it("returns null rather than throwing when the endpoint refuses", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => jsonResponse({}, 403));

    await expect(requestPhoneOtpWidget(fetcher)).resolves.toBeNull();
  });

  it("returns null when the payload does not match the contract", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      jsonResponse({ enabled: true }),
    );

    await expect(requestPhoneOtpWidget(fetcher)).resolves.toBeNull();
  });

  it("returns null when the request fails outright", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => {
      throw new Error("offline");
    });

    await expect(requestPhoneOtpWidget(fetcher)).resolves.toBeNull();
  });
});
