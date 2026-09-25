import { Msg91WidgetSuccessSchema } from "@studiocar/contracts";

/**
 * `sendOtp` and `retryOtp` report success as `{ type: "success", message:
 * reqId }`. The request id is what later resends and verifications name.
 */
export function readMsg91RequestId(data: unknown): string | null {
  const parsed = Msg91WidgetSuccessSchema.safeParse(data);
  return parsed.success ? parsed.data.message : null;
}
