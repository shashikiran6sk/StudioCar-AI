import { formatAdminDate } from "./format-admin-date";

const INVITED_BY_PREFIX = "Invited by";
const INVITED_PREFIX = "Invited";
const EXPIRES_PREFIX = "Expires";

export function describeInvitation(invite: {
  createdAt: string;
  invitedByName: string | null;
}): string {
  const on = formatAdminDate(invite.createdAt);
  const by = invite.invitedByName
    ? `${INVITED_BY_PREFIX} ${invite.invitedByName}`
    : INVITED_PREFIX;
  return on ? `${by} · ${on}` : by;
}

export function describeInvitationExpiry(expiresAt: string): string {
  const on = formatAdminDate(expiresAt);
  return on ? `${EXPIRES_PREFIX} ${on}` : "";
}
