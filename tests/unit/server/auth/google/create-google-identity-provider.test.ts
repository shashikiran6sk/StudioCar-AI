import { describe, expect, it } from "vitest";

import { parseGoogleAuthEnvironment } from "../../../../../packages/config/src/environment";
import { createGoogleIdentityProvider } from "../../../../../apps/web/src/server/auth/google/create-google-identity-provider";
import { FakeGoogleIdentityProvider } from "../../../../../apps/web/src/server/auth/google/fake-google-identity-provider";
import type { GoogleAuthEnvironment } from "../../../../../packages/config/src/environment";
import { GoogleOpenIdProvider } from "../../../../../apps/web/src/server/auth/google/google-openid-provider";

describe("createGoogleIdentityProvider", () => {
  it("uses the fake provider under the Local profile", () => {
    expect(
      createGoogleIdentityProvider(parseGoogleAuthEnvironment({ APP_ENV: "local" })),
    ).toBeInstanceOf(FakeGoogleIdentityProvider);
  });

  it("uses Google itself under the Development profile", () => {
    expect(
      createGoogleIdentityProvider(
        parseGoogleAuthEnvironment({
          APP_ENV: "development",
          DATABASE_URL: "postgresql://app:secret@localhost:5432/studiocar",
          SESSION_SECRET: "development-session-secret-of-at-least-32-characters",
          GOOGLE_CLIENT_ID: "client-id",
          GOOGLE_CLIENT_SECRET: "client-secret",
        }),
      ),
    ).toBeInstanceOf(GoogleOpenIdProvider);
  });

  it("refuses the real driver without credentials even if handed unvalidated input", () => {
    const incomplete: GoogleAuthEnvironment = {
      APP_ENV: "local",
      DATABASE_URL: "postgresql://studiocar:studiocar@localhost:5432/studiocar",
      SESSION_SECRET: "local-development-session-secret-000000",
      GOOGLE_AUTH_DRIVER: "google",
      GOOGLE_REDIRECT_URI: "http://localhost:3000/api/auth/google/callback",
      OAUTH_CHALLENGE_TTL_SECONDS: 600,
    };

    expect(() => createGoogleIdentityProvider(incomplete)).toThrow(
      /GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required/,
    );
  });
});
