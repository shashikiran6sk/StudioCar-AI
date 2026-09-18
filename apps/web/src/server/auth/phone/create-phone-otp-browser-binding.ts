import { randomBytes } from "node:crypto";

import { PHONE_OTP_BINDING_BYTES } from "./phone-auth.constants";

export function createPhoneOtpBrowserBinding(): string {
  return randomBytes(PHONE_OTP_BINDING_BYTES).toString("base64url");
}
