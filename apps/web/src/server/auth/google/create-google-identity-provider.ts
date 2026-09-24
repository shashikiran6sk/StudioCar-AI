import type { GoogleAuthEnvironment } from "@studiocar/config";

import { FakeGoogleIdentityProvider } from "./fake-google-identity-provider";
import type { GoogleIdentityProvider } from "./google-auth.types";
import { GoogleOpenIdProvider } from "./google-openid-provider";

const MISSING_GOOGLE_CREDENTIALS_ERROR =
  "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required when GOOGLE_AUTH_DRIVER is google.";

/**
 * The environment profile chooses the driver; this is the only place that
 * turns the choice into an adapter.
 */
export function createGoogleIdentityProvider(
  environment: GoogleAuthEnvironment,
): GoogleIdentityProvider {
  if (environment.GOOGLE_AUTH_DRIVER === "fake") {
    return new FakeGoogleIdentityProvider({
      redirectUri: environment.GOOGLE_REDIRECT_URI,
    });
  }

  const clientId = environment.GOOGLE_CLIENT_ID;
  const clientSecret = environment.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(MISSING_GOOGLE_CREDENTIALS_ERROR);
  }

  return new GoogleOpenIdProvider({
    clientId,
    clientSecret,
    redirectUri: environment.GOOGLE_REDIRECT_URI,
  });
}
