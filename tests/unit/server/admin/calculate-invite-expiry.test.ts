import { describe, expect, it } from "vitest";

import { calculateInviteExpiry } from "../../../../apps/web/src/server/admin/calculate-invite-expiry";

describe("calculateInviteExpiry", () => {
  it("expires an invitation seven days after it was sent", () => {
    expect(
      calculateInviteExpiry(new Date("2026-09-22T10:00:00.000Z")),
    ).toEqual(new Date("2026-09-29T10:00:00.000Z"));
  });

  it("always looks forward", () => {
    const now = new Date("2026-12-31T23:59:00.000Z");
    expect(calculateInviteExpiry(now).getTime()).toBeGreaterThan(now.getTime());
  });
});
