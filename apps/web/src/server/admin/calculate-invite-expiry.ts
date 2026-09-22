import { ADMIN_INVITE_TTL_DAYS } from "./admin.constants";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1_000;

export function calculateInviteExpiry(now: Date): Date {
  return new Date(now.getTime() + ADMIN_INVITE_TTL_DAYS * MILLISECONDS_PER_DAY);
}
