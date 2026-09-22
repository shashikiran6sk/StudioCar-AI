import { describe, expect, it, vi } from "vitest";

import type { PhoneOtpApplication } from "../../../../../../../apps/web/src/server/auth/phone/phone-auth.types";
import { getPhoneOtpApplication } from "../../../../../../../apps/web/src/server/auth/phone/phone-auth-runtime";
import { POST } from "../../../../../../../apps/web/src/app/api/auth/phone/verify/route";

vi.mock("../../../../../../../apps/web/src/server/auth/phone/phone-auth-runtime", () => ({
  getPhoneOtpApplication: vi.fn(),
}));

describe("POST /api/auth/phone/verify", () => {
  it("delegates verification and returns the authenticated user", async () => {
    const application: PhoneOtpApplication = {
      start: vi.fn(),
      verify: vi.fn(async () => ({
        token: "t".repeat(43),
        expiresAt: new Date("2026-10-18T12:00:00.000Z"),
        session: {
          id: "session-1",
          userId: "user-1",
          expiresAt: new Date("2026-10-18T12:00:00.000Z"),
          user: {
            id: "user-1",
            displayName: null,
            primaryEmail: null,
            primaryPhone: "+919876543210",
          },
        },
        user: {
          id: "user-1",
          displayName: null,
          primaryEmail: null,
          primaryPhone: "+919876543210",
        },
      })),
    };
    vi.mocked(getPhoneOtpApplication).mockReturnValue(application);

    const response = await POST(
      new Request("https://app.studiocar.test/api/auth/phone/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://app.studiocar.test",
          cookie: `studiocar_phone_otp=${"b".repeat(43)}`,
        },
        body: JSON.stringify({
          challengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
          phoneNumber: "+919876543210",
          accessToken: "signed.widget.access-token",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(application.verify).toHaveBeenCalledOnce();
  });
});
