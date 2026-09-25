import { createPhoneOtpError } from "../phone-otp-error/create-phone-otp-error";
import {
  PhoneOtpErrorCategory,
  PhoneOtpOperation,
} from "../phone-otp-error/phone-otp-error.types";
import { callMsg91Method } from "./call-msg91-method";
import { readMsg91AccessToken } from "./read-msg91-access-token";

/**
 * Exchanges the code the person typed for the provider's signed access token.
 * The code itself never leaves the browser, and the token proves nothing
 * until the server has presented it to MSG91.
 */
export function verifyMsg91Otp(
  code: string,
  requestId: string | null,
): Promise<string> {
  return callMsg91Method<string>(
    "verifyOtp",
    (resolve, reject) => {
      window.verifyOtp?.(
        code,
        (data) => {
          const accessToken = readMsg91AccessToken(data);
          if (accessToken) resolve(accessToken);
          else {
            reject(
              createPhoneOtpError(
                PhoneOtpErrorCategory.UnknownProviderError,
                PhoneOtpOperation.Verify,
              ),
            );
          }
        },
        reject,
        requestId ?? undefined,
      );
    },
    { requestId },
  );
}
