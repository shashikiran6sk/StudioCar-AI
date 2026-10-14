import type { NextResponse } from "next/server";
import { createGoogleAuthRedirect } from "./create-google-auth-redirect";

import {
  GOOGLE_AUTH_ERROR_PATH,
  GOOGLE_AUTH_ERROR_QUERY_KEY,
  OAUTH_REDIRECT_STATUS,
  type GoogleAuthRedirectErrorCode,
} from "./google-auth.constants";
import { clearGoogleOAuthCookie } from "./google-oauth-cookie";

export function createGoogleAuthErrorRedirect(
  requestUrl: URL,
  code: GoogleAuthRedirectErrorCode,
  isProduction: boolean,
): NextResponse {
  const destination = new URL(GOOGLE_AUTH_ERROR_PATH, requestUrl.origin);
  destination.searchParams.set(GOOGLE_AUTH_ERROR_QUERY_KEY, code);
  const response = createGoogleAuthRedirect(destination, OAUTH_REDIRECT_STATUS);
  const cookie = clearGoogleOAuthCookie(isProduction);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
