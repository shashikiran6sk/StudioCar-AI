import { callMsg91Method } from "./call-msg91-method";

export function sendMsg91Otp(identifier: string): Promise<void> {
  return callMsg91Method<void>("sendOtp", (resolve, reject) => {
    window.sendOtp?.(identifier, () => {
      resolve(undefined);
    }, reject);
  });
}
