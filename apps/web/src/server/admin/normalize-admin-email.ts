/**
 * Trims and lowercases, and does nothing else.
 *
 * Gmail's dot and plus aliasing is deliberately not applied: treating
 * `a.b@gmail.com` and `ab@gmail.com` as the same address would let one
 * configured value match addresses its owner never chose.
 */
export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}
