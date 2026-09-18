import { randomUUID } from "node:crypto";
import {
  PhoneAuthenticationStatus,
  PhoneVerifySchema,
  type PhoneVerifyResponse,
} from "@studiocar/contracts";
import { NextResponse } from "next/server";

import { createApiErrorResponse } from "../create-api-error-response";
import { isSameOriginRequest } from "../is-same-origin-request";
import { readClientAddress } from "../read-client-address";
import { readRequestCookie } from "../read-request-cookie";
import { createSessionCookie } from "../session-cookie";
import { createPhoneAuthErrorResponse } from "./create-phone-auth-error-response";
import {
  API_BAD_REQUEST_CODE,
  API_FORBIDDEN_CODE,
  FORBIDDEN_REQUEST_MESSAGE,
  HTTP_BAD_REQUEST_STATUS,
  HTTP_FORBIDDEN_STATUS,
  INVALID_CHALLENGE_MESSAGE,
  INVALID_REQUEST_MESSAGE,
} from "./phone-auth.constants";
import type { PhoneOtpApplication } from "./phone-auth.types";
import {
  clearPhoneOtpCookie,
  phoneOtpCookieName,
} from "./phone-otp-cookie";
import {
  PhoneOtpApplicationError,
  PhoneOtpApplicationErrorCode,
} from "./phone-otp-service";

export async function handlePhoneAuthVerify(
  request: Request,
  application: PhoneOtpApplication,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiErrorResponse({
      status: HTTP_BAD_REQUEST_STATUS,
      code: API_BAD_REQUEST_CODE,
      message: INVALID_REQUEST_MESSAGE,
      requestId: createRequestId(),
    });
  }

  const parsed = PhoneVerifySchema.safeParse(body);
  if (!parsed.success) {
    return createApiErrorResponse({
      status: HTTP_BAD_REQUEST_STATUS,
      code: API_BAD_REQUEST_CODE,
      message: INVALID_REQUEST_MESSAGE,
      requestId: createRequestId(),
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const browserBinding = readRequestCookie(
    request,
    phoneOtpCookieName(isProduction),
  );
  if (!browserBinding) {
    return createApiErrorResponse({
      status: HTTP_BAD_REQUEST_STATUS,
      code: API_BAD_REQUEST_CODE,
      message: INVALID_CHALLENGE_MESSAGE,
      requestId: createRequestId(),
    });
  }

  try {
    const completed = await application.verify(
      parsed.data,
      browserBinding,
      readClientAddress(request),
    );
    const responseBody: PhoneVerifyResponse = {
      status: PhoneAuthenticationStatus.Authenticated,
      user: completed.user,
    };
    const response = NextResponse.json(responseBody);
    const sessionCookie = createSessionCookie(
      completed.token,
      completed.expiresAt,
      isProduction,
    );
    response.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options,
    );
    const otpCookie = clearPhoneOtpCookie(isProduction);
    response.cookies.set(otpCookie.name, otpCookie.value, otpCookie.options);
    return response;
  } catch (error) {
    if (error instanceof PhoneOtpApplicationError) {
      return createPhoneAuthErrorResponse(error, createRequestId);
    }
    return createPhoneAuthErrorResponse(
      new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.ProviderUnavailable,
      ),
      createRequestId,
    );
  }
}
