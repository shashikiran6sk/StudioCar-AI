import { callMsg91Method } from "./call-msg91-method";
import { sendMsg91Otp } from "./send-msg91-otp";

/**
 * A widget without a configured retry channel refuses `retryOtp`. Falling back
 * to a fresh send keeps resend working; the application's own per-phone and
 * per-IP limits still bound how often that can happen.
 */
export function retryMsg91Otp(identifier: string): Promise<void> {
  return callMsg91Method<void>("retryOtp", (resolve, reject) => {
    window.retryOtp?.(null, () => {
      resolve(undefined);
    }, reject);
  }).catch(() => sendMsg91Otp(identifier));
}
