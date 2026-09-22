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

function request(origin: string | null): Request {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  return new Request("https://studiocar.test/api/auth/phone/widget", { headers });
}

describe("handlePhoneOtpWidget", () => {
  it("returns the widget configuration without caching it", async () => {
    const response = handlePhoneOtpWidget(request("https://studiocar.test"), widget);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual(widget);
  });

  it("refuses a cross-origin read of the widget token", () => {
    expect(handlePhoneOtpWidget(request("https://attacker.example"), widget).status).toBe(
      403,
    );
  });
});
