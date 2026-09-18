import { describe, expect, it, vi } from "vitest";

import {
  Msg91OtpProvider,
  Msg91OtpProviderError,
} from "../../../../../apps/web/src/server/auth/phone/msg91-otp-provider";
import { PhoneOtpProviderVerificationStatus } from "../../../../../apps/web/src/server/auth/phone/phone-auth.types";

const providerOptions = {
  authKey: "server-only-key",
  templateId: "template-1",
  timeoutMs: 5_000,
  baseUrl: "https://msg91.test",
};

describe("Msg91OtpProvider", () => {
  it("sends normalized numbers with credentials only in headers", async () => {
    const httpClient: typeof fetch = vi.fn(async (input, init) => {
      expect(String(input)).toContain("mobile=919876543210");
      expect(String(input)).toContain("template_id=template-1");
      expect(String(input)).not.toContain("server-only-key");
      expect(new Headers(init?.headers).get("authkey")).toBe("server-only-key");
      return Response.json({ type: "success", request_id: "request-1" });
    });
    const provider = new Msg91OtpProvider({ ...providerOptions, httpClient });

    await expect(provider.send("+919876543210")).resolves.toEqual({
      providerRequestId: "request-1",
    });
  });

  it.each([
    ["OTP Expired", PhoneOtpProviderVerificationStatus.Expired],
    ["Invalid OTP", PhoneOtpProviderVerificationStatus.Invalid],
    ["OTP not match", PhoneOtpProviderVerificationStatus.Invalid],
  ])("normalizes provider result %s", async (message, status) => {
    const httpClient: typeof fetch = vi.fn(async () =>
      Response.json({ type: "error", message }),
    );
    const provider = new Msg91OtpProvider({ ...providerOptions, httpClient });

    await expect(provider.verify("+919876543210", "123456")).resolves.toEqual({
      status,
    });
  });

  it("classifies 429 and malformed responses as provider failures", async () => {
    const limitedClient: typeof fetch = vi.fn(async () =>
      Response.json({ type: "error", message: "limit" }, { status: 429 }),
    );
    const malformedClient: typeof fetch = vi.fn(async () =>
      new Response("not-json", { status: 502 }),
    );

    await expect(
      new Msg91OtpProvider({ ...providerOptions, httpClient: limitedClient }).send(
        "+919876543210",
      ),
    ).rejects.toMatchObject({ retryable: true });
    await expect(
      new Msg91OtpProvider({ ...providerOptions, httpClient: malformedClient }).send(
        "+919876543210",
      ),
    ).rejects.toBeInstanceOf(Msg91OtpProviderError);
  });

  it("does not mistake an HTTP authentication failure for an invalid OTP", async () => {
    const httpClient: typeof fetch = vi.fn(async () =>
      Response.json(
        { type: "error", message: "Invalid auth key" },
        { status: 401 },
      ),
    );
    const provider = new Msg91OtpProvider({ ...providerOptions, httpClient });

    await expect(
      provider.verify("+919876543210", "123456"),
    ).rejects.toBeInstanceOf(Msg91OtpProviderError);
  });
});
