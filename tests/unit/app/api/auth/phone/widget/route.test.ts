import { describe, expect, it, vi } from "vitest";

const widget = {
  enabled: true,
  driver: "msg91" as const,
  widgetId: "widget-id",
  tokenAuth: "widget-token",
  devCode: null,
  reason: null,
};

vi.mock(
  "../../../../../../../apps/web/src/server/auth/phone/phone-auth-runtime",
  () => ({ getPhoneOtpWidget: () => widget }),
);

const { GET } = await import(
  "../../../../../../../apps/web/src/app/api/auth/phone/widget/route"
);

describe("GET /api/auth/phone/widget", () => {
  it("serves browser-safe widget configuration without caching", async () => {
    const response = GET(
      new Request("https://studiocar.test/api/auth/phone/widget", {
        headers: { origin: "https://studiocar.test" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual(widget);
  });

  it("refuses a cross-origin read", () => {
    expect(
      GET(
        new Request("https://studiocar.test/api/auth/phone/widget", {
          headers: { origin: "https://attacker.example" },
        }),
      ).status,
    ).toBe(403);
  });
});
