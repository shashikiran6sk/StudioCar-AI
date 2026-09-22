import { describe, expect, it } from "vitest";

import { describeAccountName } from "../../../../apps/web/src/features/admin/describe-account";

const account = {
  displayName: "Priya",
  email: "priya@example.com",
  phoneNumber: "+919876543210",
  userId: "2b8f0ad2-1c37-4a0d-9b93-9b0e1a1f2c34",
};

describe("describeAccountName", () => {
  it("prefers the name somebody chose", () => {
    expect(describeAccountName(account)).toBe("Priya");
  });

  it("falls back through what the account actually has", () => {
    expect(describeAccountName({ ...account, displayName: null })).toBe(
      "priya@example.com",
    );
    expect(
      describeAccountName({ ...account, displayName: null, email: null }),
    ).toBe("+919876543210");
  });

  it("never renders an account as empty space", () => {
    expect(
      describeAccountName({
        ...account,
        displayName: null,
        email: null,
        phoneNumber: null,
      }),
    ).toBe(account.userId);
  });
});
