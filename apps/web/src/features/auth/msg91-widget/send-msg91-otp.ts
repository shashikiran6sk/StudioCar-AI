import { callMsg91Method } from "./call-msg91-method";
import { readMsg91RequestId } from "./read-msg91-request-id";

/**
 * Starts a new provider verification request and resolves with its request
 * id, or `null` when the widget did not report one.
 */
export function sendMsg91Otp(identifier: string): Promise<string | null> {
  return callMsg91Method<string | null>("sendOtp", (resolve, reject) => {
    window.sendOtp?.(
      identifier,
      (data) => {
        resolve(readMsg91RequestId(data));
      },
      reject,
    );
  });
}
