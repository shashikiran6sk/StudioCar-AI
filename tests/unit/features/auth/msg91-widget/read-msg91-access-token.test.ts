import { describe, expect, it } from "vitest";

import { readMsg91AccessToken } from "../../../../../apps/web/src/features/auth/msg91-widget/read-msg91-access-token";

describe("readMsg91AccessToken", () => {
  it.each(["message", "accessToken", "access-token", "token", "jwt"])(
    "reads the %s field",
    (key) => {
      expect(readMsg91AccessToken({ [key]: " signed.token " })).toBe(
        "signed.token",
      );
    },
  );

  it("accepts a bare string token", () => {
    expect(readMsg91AccessToken(" signed.token ")).toBe("signed.token");
  });

  it.each([[""], [" "], [null], [undefined], [42], [{}], [{ message: "" }]])(
    "returns null for %s",
    (value) => {
      expect(readMsg91AccessToken(value)).toBeNull();
    },
  );

  it("prefers the first known carrier", () => {
    expect(
      readMsg91AccessToken({ message: "first", token: "second" }),
    ).toBe("first");
  });
});
