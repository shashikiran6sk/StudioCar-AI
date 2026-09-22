import { callMsg91Method } from "./call-msg91-method";
import { MSG91_WIDGET_NO_TOKEN_ERROR } from "./msg91-widget.constants";
import { readMsg91AccessToken } from "./read-msg91-access-token";

/**
 * Exchanges the code the person typed for the provider's signed access token.
 * The code itself never leaves the browser.
 */
export function verifyMsg91Otp(code: string): Promise<string> {
  return callMsg91Method<string>("verifyOtp", (resolve, reject) => {
    window.verifyOtp?.(code, (data) => {
      const accessToken = readMsg91AccessToken(data);
      if (accessToken) resolve(accessToken);
      else reject(new Error(MSG91_WIDGET_NO_TOKEN_ERROR));
    }, reject);
  });
}
