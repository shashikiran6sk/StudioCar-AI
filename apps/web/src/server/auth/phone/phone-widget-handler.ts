import { randomUUID } from "node:crypto";
import type { PhoneOtpWidget } from "@studiocar/contracts";

import { createApiErrorResponse } from "../create-api-error-response";
import { isSameOriginRequest } from "../is-same-origin-request";
import {
  API_FORBIDDEN_CODE,
  CACHE_CONTROL_HEADER,
  FORBIDDEN_REQUEST_MESSAGE,
  HTTP_FORBIDDEN_STATUS,
  PRIVATE_RESPONSE_CACHE_CONTROL,
} from "./phone-auth.constants";

/**
 * Served from the application rather than inlined as `NEXT_PUBLIC_*` so the
 * widget can be rotated without a rebuild, and never cached: the widget sends
 * messages from the browser, so who may read its token is a real control.
 */
export function handlePhoneOtpWidget(
  request: Request,
  widget: PhoneOtpWidget,
  createRequestId: () => string = randomUUID,
): Response {
  if (!isSameOriginRequest(request)) {
    return createApiErrorResponse({
      status: HTTP_FORBIDDEN_STATUS,
      code: API_FORBIDDEN_CODE,
      message: FORBIDDEN_REQUEST_MESSAGE,
      requestId: createRequestId(),
    });
  }

  return Response.json(widget, {
    headers: { [CACHE_CONTROL_HEADER]: PRIVATE_RESPONSE_CACHE_CONTROL },
  });
}
