import { describe, expect, it } from "vitest";

import { createGoogleAuthRedirect } from "../../../../../apps/web/src/server/auth/google/create-google-auth-redirect";
import { OAUTH_REDIRECT_STATUS, OAUTH_START_REDIRECT_STATUS } from "../../../../../apps/web/src/server/auth/google/google-auth.constants";

const TUNNEL_ORIGIN = "https://studiocar-local.trycloudflare.com";

describe("createGoogleAuthRedirect", () => {
  it("keeps the browser on its public origin when Next sees an internal URL", () => {
    const response = createGoogleAuthRedirect(
      new URL("http://localhost:3000/inventory?filter=recent#vehicles"),
      OAUTH_REDIRECT_STATUS,
    );
    const location = response.headers.get("location");
    expect(location).toBe("/inventory?filter=recent#vehicles");
    expect(new URL(location ?? "", TUNNEL_ORIGIN).origin).toBe(TUNNEL_ORIGIN);
    expect(response.status).toBe(OAUTH_REDIRECT_STATUS);
  });

  it("preserves callback parameters and the start redirect status", () => {
    const response = createGoogleAuthRedirect(
      new URL("http://localhost:3000/api/auth/google/callback?code=synthetic&state=synthetic"),
      OAUTH_START_REDIRECT_STATUS,
    );
    expect(response.status).toBe(OAUTH_START_REDIRECT_STATUS);
    expect(response.headers.get("location")).toBe(
      "/api/auth/google/callback?code=synthetic&state=synthetic",
    );
  });

  it("cannot redirect to another host through a network-path reference", () => {
    const response = createGoogleAuthRedirect(
      new URL("https://app.studiocar.test//attacker.example/path"),
      OAUTH_REDIRECT_STATUS,
    );
    const location = response.headers.get("location");
    expect(location).toBe("/attacker.example/path");
    expect(new URL(location ?? "", TUNNEL_ORIGIN).origin).toBe(TUNNEL_ORIGIN);
  });
});
