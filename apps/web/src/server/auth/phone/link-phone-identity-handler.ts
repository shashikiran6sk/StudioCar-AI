import { randomUUID } from "node:crypto";
import {
  IdentityLinkStatus,
  LinkPhoneIdentitySchema,
  type IdentityLinkResponse,
} from "@studiocar/contracts";

import { createApiErrorResponse } from "../create-api-error-response";
import { isSameOriginRequest } from "../is-same-origin-request";
import { readClientAddress } from "../read-client-address";
import { readRequestCookie } from "../read-request-cookie";
import { createPhoneAuthErrorResponse } from "./create-phone-auth-error-response";
import {
  API_BAD_REQUEST_CODE,
  API_CONFLICT_CODE,
  API_FORBIDDEN_CODE,
  FORBIDDEN_REQUEST_MESSAGE,
  HTTP_BAD_REQUEST_STATUS,
  HTTP_CONFLICT_STATUS,
  HTTP_FORBIDDEN_STATUS,
  IDENTITY_LINK_TAKEN_MESSAGE,
  INVALID_CHALLENGE_MESSAGE,
  INVALID_REQUEST_MESSAGE,
} from "./phone-auth.constants";
import type { PhoneOtpApplication } from "./phone-auth.types";
import { phoneOtpCookieName } from "./phone-otp-cookie";
import {
  PhoneOtpApplicationError,
  PhoneOtpApplicationErrorCode,
} from "./phone-otp-service";

/**
 * Connects a verified phone number to the account that is already signed in.
 * It issues no session and never transfers an identity: a number another
 * account already holds is refused.
 */
export async function handleLinkPhoneIdentity(
  request: Request,
  userId: string | null,
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
  if (!userId) {
    return createApiErrorResponse({
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Sign in before connecting another sign-in method.",
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

  const parsed = LinkPhoneIdentitySchema.safeParse(body);
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
    const result = await application.link(
      userId,
      parsed.data,
      browserBinding,
      readClientAddress(request),
    );

    if (
      result.status === IdentityLinkStatus.IdentityTaken ||
      result.status === IdentityLinkStatus.ContactTaken
    ) {
      return createApiErrorResponse({
        status: HTTP_CONFLICT_STATUS,
        code: API_CONFLICT_CODE,
        message: IDENTITY_LINK_TAKEN_MESSAGE,
        requestId: createRequestId(),
      });
    }

    const responseBody: IdentityLinkResponse = {
      status: IdentityLinkStatus.Linked,
      provider: "PHONE",
    };
    return Response.json(responseBody);
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
