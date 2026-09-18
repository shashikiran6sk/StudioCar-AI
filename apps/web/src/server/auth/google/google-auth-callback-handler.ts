import { GoogleOAuthCallbackSchema } from "@studiocar/contracts";
import { NextResponse } from "next/server";

import { readRequestCookie } from "../read-request-cookie";
import { createSessionCookie } from "../session-cookie";
import {
  GoogleAuthRedirectErrorCode,
  GOOGLE_OAUTH_CODE_QUERY_KEY,
  GOOGLE_OAUTH_ERROR_DESCRIPTION_QUERY_KEY,
  GOOGLE_OAUTH_ERROR_QUERY_KEY,
  GOOGLE_OAUTH_STATE_QUERY_KEY,
  OAUTH_REDIRECT_STATUS,
} from "./google-auth.constants";
import type { GoogleOAuthApplication } from "./google-auth.types";
import { createGoogleAuthErrorRedirect } from "./create-google-auth-error-redirect";
import {
  clearGoogleOAuthCookie,
  googleOAuthCookieName,
} from "./google-oauth-cookie";
import {
  GoogleOAuthCompletionError,
  GoogleOAuthCompletionErrorCode,
} from "./google-oauth-service";

export async function handleGoogleAuthCallback(
  request: Request,
  application: GoogleOAuthApplication,
  isProduction: boolean,
): Promise<Response> {
  const requestUrl = new URL(request.url);
  const providerError = requestUrl.searchParams.get(GOOGLE_OAUTH_ERROR_QUERY_KEY);
  const candidate = providerError
    ? {
        error: providerError,
        error_description:
          requestUrl.searchParams.get(GOOGLE_OAUTH_ERROR_DESCRIPTION_QUERY_KEY) ??
          undefined,
        state:
          requestUrl.searchParams.get(GOOGLE_OAUTH_STATE_QUERY_KEY) ?? undefined,
      }
    : {
        code: requestUrl.searchParams.get(GOOGLE_OAUTH_CODE_QUERY_KEY) ?? undefined,
        state:
          requestUrl.searchParams.get(GOOGLE_OAUTH_STATE_QUERY_KEY) ?? undefined,
      };
  const parsed = GoogleOAuthCallbackSchema.safeParse(candidate);

  if (!parsed.success) {
    return createGoogleAuthErrorRedirect(
      requestUrl,
      GoogleAuthRedirectErrorCode.InvalidCallback,
      isProduction,
    );
  }

  if ("error" in parsed.data) {
    return createGoogleAuthErrorRedirect(
      requestUrl,
      GoogleAuthRedirectErrorCode.AccessDenied,
      isProduction,
    );
  }

  const browserState = readRequestCookie(
    request,
    googleOAuthCookieName(isProduction),
  );

  if (browserState !== parsed.data.state) {
    return createGoogleAuthErrorRedirect(
      requestUrl,
      GoogleAuthRedirectErrorCode.InvalidCallback,
      isProduction,
    );
  }

  try {
    const completed = await application.complete({
      callbackUrl: requestUrl,
      state: parsed.data.state,
    });
    const destination = new URL(completed.returnTo, requestUrl.origin);
    const response = NextResponse.redirect(destination, OAUTH_REDIRECT_STATUS);
    const cookie = createSessionCookie(
      completed.issuedSession.token,
      completed.issuedSession.expiresAt,
      isProduction,
    );
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    const oauthCookie = clearGoogleOAuthCookie(isProduction);
    response.cookies.set(oauthCookie.name, oauthCookie.value, oauthCookie.options);
    return response;
  } catch (error) {
    if (error instanceof GoogleOAuthCompletionError) {
      const code =
        error.code === GoogleOAuthCompletionErrorCode.ChallengeInvalid
          ? GoogleAuthRedirectErrorCode.ChallengeInvalid
          : error.code === GoogleOAuthCompletionErrorCode.IdentityLinkRequired
            ? GoogleAuthRedirectErrorCode.IdentityLinkRequired
            : GoogleAuthRedirectErrorCode.ProviderFailed;
      return createGoogleAuthErrorRedirect(requestUrl, code, isProduction);
    }

    return createGoogleAuthErrorRedirect(
      requestUrl,
      GoogleAuthRedirectErrorCode.InternalError,
      isProduction,
    );
  }
}
