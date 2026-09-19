import { describe, expect, it } from "vitest";

import { findProfileIdentity } from "../../../../apps/web/src/features/profile/find-profile-identity";

const identities = [
  {
    provider: "GOOGLE",
    email: "priya@example.com",
    phoneNumber: null,
    linkedAt: "2026-09-19T00:00:00.000Z",
    lastAuthenticatedAt: "2026-09-19T01:00:00.000Z",
  },
] satisfies Parameters<typeof findProfileIdentity>[0];

describe("findProfileIdentity", () => {
  it("returns only the requested linked provider", () => {
    expect(findProfileIdentity(identities, "GOOGLE")?.email).toBe(
      "priya@example.com",
    );
    expect(findProfileIdentity(identities, "PHONE")).toBeUndefined();
  });
});
