import { describe, expect, it } from "vitest";

import { createGoogleAuthErrorRedirect } from "../../../../../apps/web/src/server/auth/google/create-google-auth-error-redirect";
import { GoogleAuthRedirectErrorCode } from "../../../../../apps/web/src/server/auth/google/google-auth.constants";

describe("createGoogleAuthErrorRedirect", () => {
  it("redirects only to the same-origin authentication error page", () => {
    const response = createGoogleAuthErrorRedirect(
      new URL("https://app.studiocar.test/api/auth/google/callback"),
      GoogleAuthRedirectErrorCode.ProviderFailed,
      true,
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://app.studiocar.test/auth/error?code=provider_failed",
    );
    expect(response.headers.get("set-cookie")).toContain(
      "__Host-studiocar_google_oauth=",
    );
  });
});
