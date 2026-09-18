import { describe, expect, it, vi } from "vitest";

import type { PhoneOtpApplication } from "../../../../../../../apps/web/src/server/auth/phone/phone-auth.types";
import { getPhoneOtpApplication } from "../../../../../../../apps/web/src/server/auth/phone/phone-auth-runtime";
import { POST } from "../../../../../../../apps/web/src/app/api/auth/phone/start/route";

vi.mock("../../../../../../../apps/web/src/server/auth/phone/phone-auth-runtime", () => ({
  getPhoneOtpApplication: vi.fn(),
}));

describe("POST /api/auth/phone/start", () => {
  it("delegates to the phone OTP application", async () => {
    const application: PhoneOtpApplication = {
      start: vi.fn(async () => ({
        challengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
        expiresAt: new Date("2026-09-18T12:10:00.000Z"),
        browserBinding: "b".repeat(43),
      })),
      verify: vi.fn(),
    };
    vi.mocked(getPhoneOtpApplication).mockReturnValue(application);

    const response = await POST(
      new Request("https://app.studiocar.test/api/auth/phone/start", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://app.studiocar.test",
        },
        body: JSON.stringify({ phoneNumber: "+919876543210" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(application.start).toHaveBeenCalledOnce();
  });
});
