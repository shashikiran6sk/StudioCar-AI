import { describe, expect, it, vi } from "vitest";

import { Msg91WidgetOtpProvider } from "../../../../../apps/web/src/server/auth/phone/msg91-widget-otp-provider";
import { PhoneOtpIdentificationStatus } from "../../../../../apps/web/src/server/auth/phone/phone-auth.types";

const authKey = "server-only-auth-key";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function provider(httpClient: typeof fetch): Msg91WidgetOtpProvider {
  return new Msg91WidgetOtpProvider({ authKey, timeoutMs: 5_000, httpClient });
}

describe("Msg91WidgetOtpProvider", () => {
  it("presents the access token to the widget endpoint with the server auth key", async () => {
    const httpClient = vi.fn<typeof fetch>(async () =>
      jsonResponse({ type: "success", message: "919876543210" }),
    );
    const result = await provider(httpClient).identify("token-1");

    expect(result).toEqual({
      status: PhoneOtpIdentificationStatus.Verified,
      identifier: "919876543210",
    });
    const [url, init] = httpClient.mock.calls[0] ?? [];
    expect(String(url)).toBe(
      "https://control.msg91.com/api/v5/widget/verifyAccessToken",
    );
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      authkey: authKey,
      "access-token": "token-1",
    });
  });

  it("never requires a DLT template identifier", async () => {
    const httpClient = vi.fn<typeof fetch>(async () =>
      jsonResponse({ type: "success", message: "919876543210" }),
    );
    await provider(httpClient).identify("token-1");

    const [url, init] = httpClient.mock.calls[0] ?? [];
    expect(String(url)).not.toContain("template");
    expect(String(init?.body)).not.toContain("template");
  });

  it("reads the identifier from a dedicated response field", async () => {
    const httpClient = vi.fn<typeof fetch>(async () =>
      jsonResponse({ type: "success", identifier: "+91 98765 43210" }),
    );

    await expect(provider(httpClient).identify("token-1")).resolves.toEqual({
      status: PhoneOtpIdentificationStatus.Verified,
      identifier: "919876543210",
    });
  });

  it("falls back to the access token claims when the body names no handset", async () => {
    const payload = Buffer.from(
      JSON.stringify({ mobile: "919876543210" }),
      "utf8",
    ).toString("base64url");
    const httpClient = vi.fn<typeof fetch>(async () => jsonResponse({ type: "success" }));

    await expect(
      provider(httpClient).identify(`header.${payload}.signature`),
    ).resolves.toEqual({
      status: PhoneOtpIdentificationStatus.Verified,
      identifier: "919876543210",
    });
  });

  it("rejects a verified response that names no handset at all", async () => {
    const httpClient = vi.fn<typeof fetch>(async () => jsonResponse({ type: "success" }));

    await expect(provider(httpClient).identify("opaque-token")).resolves.toEqual({
      status: PhoneOtpIdentificationStatus.Rejected,
    });
  });

  it("rejects a refused token", async () => {
    const httpClient = vi.fn<typeof fetch>(async () =>
      jsonResponse({ type: "error", message: "invalid token" }, 400),
    );

    await expect(provider(httpClient).identify("token-1")).resolves.toEqual({
      status: PhoneOtpIdentificationStatus.Rejected,
    });
  });

  it("rejects a 200 response whose type is not success", async () => {
    const httpClient = vi.fn<typeof fetch>(async () =>
      jsonResponse({ type: "error", message: "expired" }),
    );

    await expect(provider(httpClient).identify("token-1")).resolves.toEqual({
      status: PhoneOtpIdentificationStatus.Rejected,
    });
  });

  it("reports a provider fault as unavailable rather than as a refusal", async () => {
    const httpClient = vi.fn<typeof fetch>(async () => jsonResponse({ type: "error" }, 503));

    await expect(provider(httpClient).identify("token-1")).resolves.toEqual({
      status: PhoneOtpIdentificationStatus.Unavailable,
    });
  });

  it("reports an unreachable provider as unavailable", async () => {
    const httpClient = vi.fn<typeof fetch>(async () => {
      throw new Error("network down");
    });

    await expect(provider(httpClient).identify("token-1")).resolves.toEqual({
      status: PhoneOtpIdentificationStatus.Unavailable,
    });
  });

  it("treats an unparseable success body as a refusal", async () => {
    const httpClient = vi.fn<typeof fetch>(
      async () => new Response("not json", { status: 200 }),
    );

    await expect(provider(httpClient).identify("token-1")).resolves.toEqual({
      status: PhoneOtpIdentificationStatus.Rejected,
    });
  });
});
