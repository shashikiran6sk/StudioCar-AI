import {
  ApplicationErrorCode,
  reportUnexpectedError,
} from "@studiocar/observability";
import { randomUUID } from "node:crypto";
import {
  PhoneAuthenticationStatus,
  PhoneStartSchema,
  type PhoneStartResponse,
} from "@studiocar/contracts";
import { NextResponse } from "next/server";

import { createApiErrorResponse } from "../create-api-error-response";
import { isSameOriginRequest } from "../is-same-origin-request";
import { readClientAddress } from "../read-client-address";
import { createPhoneAuthErrorResponse } from "./create-phone-auth-error-response";
import {
  API_BAD_REQUEST_CODE,
  API_FORBIDDEN_CODE,
  FORBIDDEN_REQUEST_MESSAGE,
  HTTP_BAD_REQUEST_STATUS,
  HTTP_CREATED_STATUS,
  HTTP_FORBIDDEN_STATUS,
  INVALID_REQUEST_MESSAGE,
} from "./phone-auth.constants";
import type { PhoneOtpApplication } from "./phone-auth.types";
import { createPhoneOtpCookie } from "./phone-otp-cookie";
import {
  PhoneOtpApplicationError,
  PhoneOtpApplicationErrorCode,
} from "./phone-otp-service";

export async function handlePhoneAuthStart(
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

  const parsed = PhoneStartSchema.safeParse(body);
  if (!parsed.success) {
    return createApiErrorResponse({
      status: HTTP_BAD_REQUEST_STATUS,
      code: API_BAD_REQUEST_CODE,
      message: INVALID_REQUEST_MESSAGE,
      requestId: createRequestId(),
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const started = await application.start(
      parsed.data,
      readClientAddress(request),
    );
    const responseBody: PhoneStartResponse = {
      status: PhoneAuthenticationStatus.ChallengeSent,
      challengeId: started.challengeId,
      expiresAt: started.expiresAt.toISOString(),
    };
    const response = NextResponse.json(responseBody, {
      status: HTTP_CREATED_STATUS,
    });
    const cookie = createPhoneOtpCookie(
      started.browserBinding,
      started.expiresAt,
      isProduction,
    );
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    if (error instanceof PhoneOtpApplicationError) {
      return createPhoneAuthErrorResponse(error, createRequestId);
    }
    reportUnexpectedError(error, ApplicationErrorCode.INTERNAL_ERROR);
    return createPhoneAuthErrorResponse(
      new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.ServiceUnavailable,
      ),
      createRequestId,
    );
  }
}
