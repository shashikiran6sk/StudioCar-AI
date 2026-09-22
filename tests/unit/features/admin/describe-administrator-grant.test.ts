import { describe, expect, it } from "vitest";

import { describeAdministratorGrant } from "../../../../apps/web/src/features/admin/describe-administrator-grant";

describe("describeAdministratorGrant", () => {
  it("names the initial administrator", () => {
    expect(
      describeAdministratorGrant({
        source: "BOOTSTRAP",
        grantedAt: "2026-09-20T10:00:00.000Z",
        grantedByName: null,
      }),
    ).toMatch(/^Initial administrator · /);
  });

  it("names who granted access", () => {
    expect(
      describeAdministratorGrant({
        source: "ADMIN_GRANT",
        grantedAt: "2026-09-21T10:00:00.000Z",
        grantedByName: "Initial Admin",
      }),
    ).toMatch(/^Granted by Initial Admin · /);
  });

  it("says only what it knows when the granter is gone", () => {
    // grantedByUserId is set to null when that account is deleted.
    expect(
      describeAdministratorGrant({
        source: "INVITATION",
        grantedAt: "2026-09-21T10:00:00.000Z",
        grantedByName: null,
      }),
    ).toMatch(/^Granted /);
  });

  it("omits an unparseable date rather than printing Invalid Date", () => {
    expect(
      describeAdministratorGrant({
        source: "BOOTSTRAP",
        grantedAt: "not-a-date",
        grantedByName: null,
      }),
    ).toBe("Initial administrator");
  });
});
