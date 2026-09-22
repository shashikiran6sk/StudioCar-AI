import { describe, expect, it } from "vitest";

import { handlePhoneOtpWidget } from "../../../../../apps/web/src/server/auth/phone/phone-widget-handler";

const widget = {
  enabled: true,
  driver: "msg91" as const,
  widgetId: "widget-id",
  tokenAuth: "widget-token",
  devCode: null,
  reason: null,
};

describe("handlePhoneOtpWidget", () => {
  it("returns the widget configuration", async () => {
    const response = handlePhoneOtpWidget(widget);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(widget);
  });

  it("never lets a shared cache hold the response", () => {
    expect(handlePhoneOtpWidget(widget).headers.get("cache-control")).toBe(
      "no-store",
    );
  });

  it("carries no server credential", async () => {
    const body = await handlePhoneOtpWidget(widget).text();

    expect(body).not.toContain("authkey");
    expect(Object.keys(widget)).not.toContain("authKey");
  });
});
