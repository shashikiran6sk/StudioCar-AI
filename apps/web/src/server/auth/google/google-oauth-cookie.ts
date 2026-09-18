const PRODUCTION_GOOGLE_OAUTH_COOKIE_NAME = "__Host-studiocar_google_oauth";
const DEVELOPMENT_GOOGLE_OAUTH_COOKIE_NAME = "studiocar_google_oauth";

export interface GoogleOAuthCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  expires: Date;
}

export interface GoogleOAuthCookie {
  name: string;
  value: string;
  options: GoogleOAuthCookieOptions;
}

export function googleOAuthCookieName(isProduction: boolean): string {
  return isProduction
    ? PRODUCTION_GOOGLE_OAUTH_COOKIE_NAME
    : DEVELOPMENT_GOOGLE_OAUTH_COOKIE_NAME;
}

export function createGoogleOAuthCookie(
  state: string,
  expires: Date,
  isProduction: boolean,
): GoogleOAuthCookie {
  return {
    name: googleOAuthCookieName(isProduction),
    value: state,
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      expires,
    },
  };
}

export function clearGoogleOAuthCookie(isProduction: boolean): GoogleOAuthCookie {
  return createGoogleOAuthCookie("", new Date(0), isProduction);
}
