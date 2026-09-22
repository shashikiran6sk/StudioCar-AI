import { describe, expect, it } from "vitest";

import { parseAccountLookup } from "../../../../apps/web/src/server/admin/parse-account-lookup";

describe("parseAccountLookup", () => {
  it("reads an email address", () => {
    expect(parseAccountLookup(" Owner@Example.com ")).toEqual({
      email: "owner@example.com",
    });
  });

  it("reads a mobile number however it was written", () => {
    expect(parseAccountLookup("+91 98765-43210")).toEqual({
      phoneNumber: "+919876543210",
    });
  });

  it("returns nothing for a blank lookup", () => {
    expect(parseAccountLookup("   ")).toBeNull();
  });

  it("returns nothing for a value that is neither", () => {
    expect(parseAccountLookup("owner")).toBeNull();
    expect(parseAccountLookup("12345")).toBeNull();
    expect(parseAccountLookup("owner@")).toBeNull();
  });
});
