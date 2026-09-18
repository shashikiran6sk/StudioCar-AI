import { describe, expect, it } from "vitest";

import { readRequestCookie } from "../../../../apps/web/src/server/auth/read-request-cookie";

describe("readRequestCookie", () => {
  it("reads an exact cookie name without confusing prefixes", () => {
    const request = new Request("https://app.studiocar.test", {
      headers: {
        cookie: "studiocar_google_oauth_old=wrong; studiocar_google_oauth=state-value",
      },
    });

    expect(readRequestCookie(request, "studiocar_google_oauth")).toBe(
      "state-value",
    );
    expect(readRequestCookie(request, "missing_cookie")).toBeUndefined();
  });
});
