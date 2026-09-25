import { callMsg91Method } from "./call-msg91-method";
import { readMsg91RequestId } from "./read-msg91-request-id";

/**
 * Resends the code for an existing provider request. A refusal — including
 * MSG91's own resend delay — is reported as-is; it never silently becomes a
 * fresh send, which would bypass the provider's resend policy.
 */
export function retryMsg91Otp(
  requestId: string | null,
  channel: string | null,
): Promise<string | null> {
  return callMsg91Method<string | null>(
    "retryOtp",
    (resolve, reject) => {
      window.retryOtp?.(
        channel,
        (data) => {
          resolve(readMsg91RequestId(data) ?? requestId);
        },
        reject,
        requestId ?? undefined,
      );
    },
    { requestId },
  );
}
