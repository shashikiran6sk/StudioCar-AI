import { describe, expect, it } from "vitest";

import { readMsg91Identifier } from "../../../../../apps/web/src/server/auth/phone/read-msg91-identifier";

function tokenWithClaims(claims: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString(
    "base64url",
  );
  return `header.${payload}.signature`;
}

describe("readMsg91Identifier", () => {
  it.each(["identifier", "mobile", "number", "phone", "msisdn", "message"])(
    "reads the %s response field",
    (field) => {
      expect(
        readMsg91Identifier({ [field]: "919876543210" }, "opaque"),
      ).toBe("919876543210");
    },
  );

  it("prefers the response body over the token claims", () => {
    expect(
      readMsg91Identifier(
        { identifier: "919876543210" },
        tokenWithClaims({ mobile: "919999999999" }),
      ),
    ).toBe("919876543210");
  });

  it("falls back to the token claims", () => {
    expect(
      readMsg91Identifier({}, tokenWithClaims({ msisdn: "+919876543210" })),
    ).toBe("919876543210");
  });

  it("returns null for an opaque token and an empty body", () => {
    expect(readMsg91Identifier({}, "opaque")).toBeNull();
  });

  it("returns null when the token payload is not valid base64url JSON", () => {
    expect(readMsg91Identifier({}, "header.!!!not-base64!!!.signature")).toBeNull();
  });

  it("ignores a non-numeric success message", () => {
    expect(readMsg91Identifier({ message: "OTP verified" }, "opaque")).toBeNull();
  });
});
