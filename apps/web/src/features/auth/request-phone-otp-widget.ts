import { PhoneOtpWidgetSchema, type PhoneOtpWidget } from "@studiocar/contracts";

import { PHONE_AUTH_WIDGET_PATH } from "../../app/app-routes";

/**
 * Widget credentials are fetched rather than inlined as `NEXT_PUBLIC_*` so a
 * rotation is a restart and not a rebuild, and so the endpoint keeps deciding
 * who may read a token that can send messages.
 */
export async function requestPhoneOtpWidget(
  fetcher: typeof fetch = fetch,
): Promise<PhoneOtpWidget | null> {
  try {
    const response = await fetcher(PHONE_AUTH_WIDGET_PATH, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    const parsed = PhoneOtpWidgetSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
