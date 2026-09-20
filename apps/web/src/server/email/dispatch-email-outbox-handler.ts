import { randomUUID } from "node:crypto";
import type { EmailOutboxDispatcher } from "@studiocar/email";

import { createApiErrorResponse } from "../auth/create-api-error-response";
import { dispatchTokenIsValid } from "../internal/dispatch-token-is-valid";
import {
  EMAIL_DISPATCH_FORBIDDEN_CODE,
  EMAIL_DISPATCH_FORBIDDEN_MESSAGE,
  EMAIL_DISPATCH_FORBIDDEN_STATUS,
  EMAIL_DISPATCH_UNAVAILABLE_CODE,
  EMAIL_DISPATCH_UNAVAILABLE_MESSAGE,
  EMAIL_DISPATCH_UNAVAILABLE_STATUS,
} from "./email-dispatch.constants";

export async function handleDispatchEmailOutbox(
  request: Request,
  expectedToken: string,
  dispatcher: Pick<EmailOutboxDispatcher, "dispatch">,
  createRequestId: () => string = randomUUID,
): Promise<Response> {
  if (!dispatchTokenIsValid(request, expectedToken)) {
    return createApiErrorResponse({
      status: EMAIL_DISPATCH_FORBIDDEN_STATUS,
      code: EMAIL_DISPATCH_FORBIDDEN_CODE,
      message: EMAIL_DISPATCH_FORBIDDEN_MESSAGE,
      requestId: createRequestId(),
    });
  }
  try {
    return Response.json(await dispatcher.dispatch());
  } catch {
    return createApiErrorResponse({
      status: EMAIL_DISPATCH_UNAVAILABLE_STATUS,
      code: EMAIL_DISPATCH_UNAVAILABLE_CODE,
      message: EMAIL_DISPATCH_UNAVAILABLE_MESSAGE,
      requestId: createRequestId(),
    });
  }
}
