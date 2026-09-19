import { describe, expect, it } from "vitest";

import { userDisplayName } from "../../../../apps/web/src/features/shell/user-display-name";

describe("userDisplayName", () => {
  it("prefers display name, then verified contact details", () => {
    expect(
      userDisplayName({
        id: "user-1",
        displayName: "Priya Sharma",
        primaryEmail: "priya@example.com",
        primaryPhone: "+919876543210",
      }),
    ).toBe("Priya Sharma");
    expect(
      userDisplayName({
        id: "user-2",
        displayName: null,
        primaryEmail: "owner@example.com",
        primaryPhone: null,
      }),
    ).toBe("owner@example.com");
  });

  it("provides a stable fallback for an account without profile details", () => {
    expect(
      userDisplayName({
        id: "user-3",
        displayName: null,
        primaryEmail: null,
        primaryPhone: null,
      }),
    ).toBe("StudioCar user");
  });
});
