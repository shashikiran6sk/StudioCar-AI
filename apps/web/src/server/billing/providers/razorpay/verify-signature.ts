import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyRazorpaySignature(
  message: string,
  suppliedHex: string | null,
  secret: string,
): boolean {
  if (!suppliedHex || !/^[a-f0-9]{64}$/.test(suppliedHex)) return false;
  const expected = createHmac("sha256", secret).update(message).digest();
  const supplied = Buffer.from(suppliedHex, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
