import { describe, expect, it, vi } from "vitest";

import { IdentityLinkStatus } from "../../../../../packages/contracts/src/auth";
import { handleLinkPhoneIdentity } from "../../../../../apps/web/src/server/auth/phone/link-phone-identity-handler";
import type { PhoneOtpApplication } from "../../../../../apps/web/src/server/auth/phone/phone-auth.types";
import {
  PhoneOtpApplicationError,
  PhoneOtpApplicationErrorCode,
} from "../../../../../apps/web/src/server/auth/phone/phone-otp-service";

const BINDING = "b".repeat(43);
const BODY = {
  challengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
  phoneNumber: "+919876543210",
  accessToken: "signed.widget.access-token",
};

function application(
  link: PhoneOtpApplication["link"] = vi.fn(async () => ({
    status: IdentityLinkStatus.Linked,
  })),
): PhoneOtpApplication {
  return { start: vi.fn(), verify: vi.fn(), link };
}

function request(
  options: { origin?: string; cookie?: boolean; body?: unknown } = {},
): Request {
  const headers = new Headers({
    origin: options.origin ?? "https://studiocar.test",
    "content-type": "application/json",
  });
  if (options.cookie !== false) {
    headers.set("cookie", `studiocar_phone_otp=${BINDING}`);
  }
  return new Request("https://studiocar.test/api/profile/identities/phone", {
    method: "POST",
    headers,
    body: JSON.stringify(options.body ?? BODY),
  });
}

describe("handleLinkPhoneIdentity", () => {
  it("connects a proven number to the signed-in account", async () => {
    const link = vi.fn(async () => ({ status: IdentityLinkStatus.Linked }));
    const response = await handleLinkPhoneIdentity(
      request(),
      "user-1",
      application(link),
      false,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "linked",
      provider: "PHONE",
    });
    expect(link).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ phoneNumber: "+919876543210" }),
      BINDING,
      expect.any(String),
    );
  });

  it("refuses a cross-origin request", async () => {
    const response = await handleLinkPhoneIdentity(
      request({ origin: "https://attacker.example" }),
      "user-1",
      application(),
      false,
    );

    expect(response.status).toBe(403);
  });

  it("refuses without a session, so nobody links on another's behalf", async () => {
    const link = vi.fn();
    const response = await handleLinkPhoneIdentity(
      request(),
      null,
      application(link),
      false,
    );

    expect(response.status).toBe(401);
    expect(link).not.toHaveBeenCalled();
  });

  it("refuses without the browser-binding cookie", async () => {
    const response = await handleLinkPhoneIdentity(
      request({ cookie: false }),
      "user-1",
      application(),
      false,
    );

    expect(response.status).toBe(400);
  });

  it("refuses a number another account already holds", async () => {
    const response = await handleLinkPhoneIdentity(
      request(),
      "user-1",
      application(vi.fn(async () => ({ status: IdentityLinkStatus.IdentityTaken }))),
      false,
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "CONFLICT" },
    });
  });

  it("refuses a contact detail another account already holds", async () => {
    const response = await handleLinkPhoneIdentity(
      request(),
      "user-1",
      application(vi.fn(async () => ({ status: IdentityLinkStatus.ContactTaken }))),
      false,
    );

    expect(response.status).toBe(409);
  });

  it("reports an already-connected number as success", async () => {
    const response = await handleLinkPhoneIdentity(
      request(),
      "user-1",
      application(vi.fn(async () => ({ status: IdentityLinkStatus.AlreadyLinked }))),
      false,
    );

    expect(response.status).toBe(200);
  });

  it("rejects a malformed body without reaching the application", async () => {
    const link = vi.fn();
    const response = await handleLinkPhoneIdentity(
      request({ body: { phoneNumber: "nope" } }),
      "user-1",
      application(link),
      false,
    );

    expect(response.status).toBe(400);
    expect(link).not.toHaveBeenCalled();
  });

  it("surfaces a provider outage as a service error, not a refusal", async () => {
    const response = await handleLinkPhoneIdentity(
      request(),
      "user-1",
      application(
        vi.fn(async () => {
          throw new PhoneOtpApplicationError(
            PhoneOtpApplicationErrorCode.ProviderUnavailable,
          );
        }),
      ),
      false,
    );

    expect(response.status).toBe(503);
  });
});
