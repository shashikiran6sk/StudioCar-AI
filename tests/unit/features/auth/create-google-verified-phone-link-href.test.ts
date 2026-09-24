import { describe, expect, it } from "vitest";

import { createGoogleVerifiedPhoneLinkHref } from "../../../../apps/web/src/features/auth/create-google-verified-phone-link-href";

describe("createGoogleVerifiedPhoneLinkHref", () => {
  it("starts the shared OAuth route with the verified-phone intent", () => {
    expect(createGoogleVerifiedPhoneLinkHref("/inventory")).toBe(
      "/api/auth/google/start?intent=link_verified_phone&returnTo=%2Finventory",
    );
  });
});
