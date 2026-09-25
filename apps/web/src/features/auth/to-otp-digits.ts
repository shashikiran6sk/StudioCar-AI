/**
 * Keeps only digits, up to the code length, so pasted text such as
 * "123 456" or "Code: 123456" becomes the code and letters never reach the
 * provider.
 */
export function toOtpDigits(value: string, maxLength: number): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}
