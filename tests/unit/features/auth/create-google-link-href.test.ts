import { describe, expect, it } from "vitest";

import { createGoogleLinkHref } from "../../../../apps/web/src/features/auth/create-google-link-href";

describe("createGoogleLinkHref", () => {
  it("asks for a link rather than a sign-in", () => {
    const href = createGoogleLinkHref("/settings/profile");

    expect(href).toBe(
      "/api/auth/google/start?returnTo=%2Fsettings%2Fprofile&intent=link",
    );
  });

  it("carries no account identifier in the URL", () => {
    // The account being linked travels inside the encrypted challenge instead.
    expect(createGoogleLinkHref("/settings/profile")).not.toContain("user");
  });
});
