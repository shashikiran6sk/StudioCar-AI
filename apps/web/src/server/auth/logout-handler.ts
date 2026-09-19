import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { createApiErrorResponse } from "./create-api-error-response";
import { isSameOriginRequest } from "./is-same-origin-request";
import { readRequestCookie } from "./read-request-cookie";
import { clearSessionCookie, sessionCookieName } from "./session-cookie";
import type { SessionService } from "./session-service";

const FORBIDDEN_STATUS = 403;
const FORBIDDEN_CODE = "FORBIDDEN";
const FORBIDDEN_MESSAGE = "The request origin is not allowed.";
const LOGOUT_REDIRECT_STATUS = 303;
const LOGIN_PATH = "/login";

export async function handleLogout(
  request: Request,
  sessions: SessionService,
  isProduction: boolean,
  createRequestId: () => string = randomUUID,
): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return createApiErrorResponse({
      status: FORBIDDEN_STATUS,
      code: FORBIDDEN_CODE,
      message: FORBIDDEN_MESSAGE,
      requestId: createRequestId(),
    });
  }

  const token = readRequestCookie(request, sessionCookieName(isProduction));
  if (token) await sessions.logout(token);

  const response = NextResponse.redirect(
    new URL(LOGIN_PATH, request.url),
    LOGOUT_REDIRECT_STATUS,
  );
  const cookie = clearSessionCookie(isProduction);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
