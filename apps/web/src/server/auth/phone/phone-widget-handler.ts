import type { PhoneOtpWidget } from "@studiocar/contracts";

import {
  CACHE_CONTROL_HEADER,
  PRIVATE_RESPONSE_CACHE_CONTROL,
} from "./phone-auth.constants";

/**
 * Serves the browser-safe half of the OTP widget configuration.
 *
 * There is deliberately no origin check here. Browsers omit `Origin` on
 * same-origin GET requests, so requiring it would reject the sign-in page's own
 * read. Origin checks defend state-changing requests against CSRF, and this
 * changes nothing.
 *
 * What protects the MSG91 balance is that `MSG91_AUTH_KEY` is never in this
 * response, and that MSG91 only honours the widget on domains allow-listed in
 * its console. The response is `no-store` so a shared cache never holds it.
 */
export function handlePhoneOtpWidget(widget: PhoneOtpWidget): Response {
  return Response.json(widget, {
    headers: { [CACHE_CONTROL_HEADER]: PRIVATE_RESPONSE_CACHE_CONTROL },
  });
}
