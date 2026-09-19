import { describe, expect, it } from "vitest";

import { createGoogleAuthStartHref } from "../../../../apps/web/src/features/auth/create-google-auth-start-href";

describe("createGoogleAuthStartHref", () => {
  it("encodes the validated return path", () => {
    expect(createGoogleAuthStartHref("/inventory?status=ready")).toBe(
      "/api/auth/google/start?returnTo=%2Finventory%3Fstatus%3Dready",
    );
  });
});
