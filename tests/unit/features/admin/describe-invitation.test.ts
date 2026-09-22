import { describe, expect, it } from "vitest";

import {
  describeInvitation,
  describeInvitationExpiry,
} from "../../../../apps/web/src/features/admin/describe-invitation";

describe("describeInvitation", () => {
  it("names who invited and when", () => {
    expect(
      describeInvitation({
        createdAt: "2026-09-22T10:00:00.000Z",
        invitedByName: "Initial Admin",
      }),
    ).toMatch(/^Invited by Initial Admin · /);
  });

  it("says only what it knows when the inviter is unnamed", () => {
    expect(
      describeInvitation({
        createdAt: "2026-09-22T10:00:00.000Z",
        invitedByName: null,
      }),
    ).toMatch(/^Invited · /);
  });
});

describe("describeInvitationExpiry", () => {
  it("states when an invitation stops working", () => {
    expect(describeInvitationExpiry("2026-09-29T10:00:00.000Z")).toMatch(
      /^Expires /,
    );
  });

  it("says nothing rather than printing an unusable date", () => {
    expect(describeInvitationExpiry("not-a-date")).toBe("");
  });
});
