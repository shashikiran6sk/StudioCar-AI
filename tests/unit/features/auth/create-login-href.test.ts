import { describe, expect, it } from "vitest";

import { createLoginHref } from "../../../../apps/web/src/features/auth/create-login-href";

describe("createLoginHref", () => {
  it("encodes the destination, including its section anchor", () => {
    expect(createLoginHref("/settings/billing#packs")).toBe(
      "/login?returnTo=%2Fsettings%2Fbilling%23packs",
    );
  });
});
