import { IdentityLinkStatus } from "../../../../../../../packages/contracts/src/auth";
import { describe, expect, it, vi } from "vitest";

const link = vi.fn(async () => ({ status: IdentityLinkStatus.Linked }));
const getCurrentSession = vi.fn();

vi.mock(
  "../../../../../../../apps/web/src/server/auth/phone/phone-auth-runtime",
  () => ({ getPhoneOtpApplication: () => ({ start: vi.fn(), verify: vi.fn(), link }) }),
);
vi.mock(
  "../../../../../../../apps/web/src/server/auth/get-current-session",
  () => ({ getCurrentSession }),
);

const { POST } = await import(
  "../../../../../../../apps/web/src/app/api/profile/identities/phone/route"
);

function request(): Request {
  return new Request("https://studiocar.test/api/profile/identities/phone", {
    method: "POST",
    headers: {
      origin: "https://studiocar.test",
      "content-type": "application/json",
      cookie: `studiocar_phone_otp=${"b".repeat(43)}`,
    },
    body: JSON.stringify({
      challengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
      phoneNumber: "+919876543210",
      accessToken: "signed.widget.access-token",
    }),
  });
}

describe("POST /api/profile/identities/phone", () => {
  it("links the number to the signed-in account", async () => {
    getCurrentSession.mockResolvedValue({ userId: "user-1" });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(link).toHaveBeenCalledWith(
      "user-1",
      expect.anything(),
      expect.any(String),
      expect.any(String),
    );
  });

  it("refuses when nobody is signed in", async () => {
    getCurrentSession.mockResolvedValue(null);

    expect((await POST(request())).status).toBe(401);
  });
});
