import { randomUUID } from "node:crypto";
import {
  GoogleAuthStartSchema,
  type ApiError,
} from "@studiocar/contracts";

import {
  API_BAD_REQUEST_CODE,
  API_UNAUTHENTICATED_CODE,
  GOOGLE_AUTH_INTENT_QUERY_KEY,
  GOOGLE_AUTH_LINK_INTENT,
  LINK_REQUIRES_SESSION_MESSAGE,
  UNAUTHENTICATED_STATUS,
  API_SERVICE_UNAVAILABLE_CODE,
  BAD_REQUEST_MESSAGE,
  BAD_REQUEST_STATUS,
  GOOGLE_AUTH_RETURN_TO_QUERY_KEY,
  OAUTH_START_REDIRECT_STATUS,
  SERVICE_UNAVAILABLE_MESSAGE,
  SERVICE_UNAVAILABLE_STATUS,
} from "./google-auth.constants";
import type { GoogleOAuthApplication } from "./google-auth.types";
import { createGoogleOAuthCookie } from "./google-oauth-cookie";
import { NextResponse } from "next/server";

export async function handleGoogleAuthStart(
  request: Request,
  application: GoogleOAuthApplication,
  isProduction: boolean,
  sessionUserId: string | null = null,
  createRequestId: () => string = randomUUID,
): Promise<Response> {
  const requestUrl = new URL(request.url);
  const linking =
    requestUrl.searchParams.get(GOOGLE_AUTH_INTENT_QUERY_KEY) ===
    GOOGLE_AUTH_LINK_INTENT;

  /**
   * Connecting Google to an account requires being signed in as that account.
   * A link cannot be started on behalf of somebody else.
   */
  if (linking && sessionUserId === null) {
    const body: ApiError = {
      error: {
        code: API_UNAUTHENTICATED_CODE,
        message: LINK_REQUIRES_SESSION_MESSAGE,
        requestId: createRequestId(),
      },
    };
    return Response.json(body, { status: UNAUTHENTICATED_STATUS });
  }
  const result = GoogleAuthStartSchema.safeParse({
    returnTo:
      requestUrl.searchParams.get(GOOGLE_AUTH_RETURN_TO_QUERY_KEY) ?? undefined,
  });

  if (!result.success) {
    const body: ApiError = {
      error: {
        code: API_BAD_REQUEST_CODE,
        message: BAD_REQUEST_MESSAGE,
        requestId: createRequestId(),
        fieldErrors: result.error.flatten().fieldErrors,
      },
    };
    return Response.json(body, { status: BAD_REQUEST_STATUS });
  }

  try {
    const started = await application.start({
      ...result.data,
      ...(linking && sessionUserId !== null
        ? { linkUserId: sessionUserId }
        : {}),
    });
    const response = NextResponse.redirect(
      started.authorizationUrl,
      OAUTH_START_REDIRECT_STATUS,
    );
    const cookie = createGoogleOAuthCookie(
      started.state,
      started.expiresAt,
      isProduction,
    );
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch {
    const body: ApiError = {
      error: {
        code: API_SERVICE_UNAVAILABLE_CODE,
        message: SERVICE_UNAVAILABLE_MESSAGE,
        requestId: createRequestId(),
      },
    };
    return Response.json(body, { status: SERVICE_UNAVAILABLE_STATUS });
  }
}
