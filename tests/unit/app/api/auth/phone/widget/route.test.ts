import { describe, expect, it, vi } from "vitest";

const widget = {
  enabled: true,
  driver: "fake" as const,
  widgetId: null,
  tokenAuth: null,
  devCode: "1234",
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
    const response = await GET(
      new Request("https://app.test/api/auth/phone/widget"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual(widget);
  });
});
