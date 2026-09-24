import { randomUUID } from "node:crypto";
import {
  PhoneAuthenticationStatus,
  UpdateProfileSchema,
  type PhoneVerifyResponse,
} from "@studiocar/contracts";
import { NextResponse } from "next/server";

import { createApiErrorResponse } from "../create-api-error-response";
import { isSameOriginRequest } from "../is-same-origin-request";
import { readRequestCookie } from "../read-request-cookie";
import { createSessionCookie } from "../session-cookie";
import {
  API_BAD_REQUEST_CODE,
  API_CONFLICT_CODE,
  API_FORBIDDEN_CODE,
  API_SERVICE_UNAVAILABLE_CODE,
  HTTP_BAD_REQUEST_STATUS,
  HTTP_CONFLICT_STATUS,
  HTTP_FORBIDDEN_STATUS,
  HTTP_SERVICE_UNAVAILABLE_STATUS,
  FORBIDDEN_REQUEST_MESSAGE,
  INVALID_REQUEST_MESSAGE,
  PHONE_ACCOUNT_TAKEN_MESSAGE,
  PHONE_ACCOUNT_UNAVAILABLE_MESSAGE,
  PHONE_VERIFICATION_REQUIRED_MESSAGE,
} from "./phone-auth.constants";
import { clearPhoneOtpCookie, phoneOtpCookieName } from "./phone-otp-cookie";
import type { PhoneAccountService } from "./phone-account-service";
import {
  clearVerifiedPhoneCookie,
  readVerifiedPhoneChallengeId,
  verifiedPhoneCookieName,
} from "./verified-phone-cookie";

export async function handleCreatePhoneAccount(
  request: Request,
  accounts: Pick<PhoneAccountService, "createAccount">,
  isProduction: boolean,
  createRequestId: () => string = randomUUID,
): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return createApiErrorResponse({
      status: HTTP_FORBIDDEN_STATUS,
      code: API_FORBIDDEN_CODE,
      message: FORBIDDEN_REQUEST_MESSAGE,
      requestId: createRequestId(),
    });
  }
  const challengeId = readRequestCookie(
    request,
    verifiedPhoneCookieName(isProduction),
  );
  const browserBinding = readRequestCookie(
    request,
    phoneOtpCookieName(isProduction),
  );
  const verifiedChallengeId = readVerifiedPhoneChallengeId(challengeId);
  if (!verifiedChallengeId || !browserBinding) {
    return createApiErrorResponse({
      status: HTTP_BAD_REQUEST_STATUS,
      code: API_BAD_REQUEST_CODE,
      message: PHONE_VERIFICATION_REQUIRED_MESSAGE,
      requestId: createRequestId(),
    });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return createApiErrorResponse({
      status: HTTP_BAD_REQUEST_STATUS,
      code: API_BAD_REQUEST_CODE,
      message: INVALID_REQUEST_MESSAGE,
      requestId: createRequestId(),
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  let result: Awaited<ReturnType<PhoneAccountService["createAccount"]>>;
  try {
    result = await accounts.createAccount(
      verifiedChallengeId,
      browserBinding,
      parsed.data,
    );
  } catch {
    return createApiErrorResponse({
      status: HTTP_SERVICE_UNAVAILABLE_STATUS,
      code: API_SERVICE_UNAVAILABLE_CODE,
      message: PHONE_ACCOUNT_UNAVAILABLE_MESSAGE,
      requestId: createRequestId(),
    });
  }
  if (result.kind === "INVALID_VERIFICATION") {
    return createApiErrorResponse({
      status: HTTP_BAD_REQUEST_STATUS,
      code: API_BAD_REQUEST_CODE,
      message: PHONE_VERIFICATION_REQUIRED_MESSAGE,
      requestId: createRequestId(),
    });
  }
  if (result.kind === "PHONE_TAKEN") {
    return createApiErrorResponse({
      status: HTTP_CONFLICT_STATUS,
      code: API_CONFLICT_CODE,
      message: PHONE_ACCOUNT_TAKEN_MESSAGE,
      requestId: createRequestId(),
    });
  }

  const responseBody: PhoneVerifyResponse = {
    status: PhoneAuthenticationStatus.Authenticated,
    user: result.issuedSession.session.user,
  };
  const response = NextResponse.json(responseBody);
  const sessionCookie = createSessionCookie(
    result.issuedSession.token,
    result.issuedSession.expiresAt,
    isProduction,
  );
  response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options);
  const otpCookie = clearPhoneOtpCookie(isProduction);
  response.cookies.set(otpCookie.name, otpCookie.value, otpCookie.options);
  const verifiedCookie = clearVerifiedPhoneCookie(isProduction);
  response.cookies.set(
    verifiedCookie.name,
    verifiedCookie.value,
    verifiedCookie.options,
  );
  return response;
}
