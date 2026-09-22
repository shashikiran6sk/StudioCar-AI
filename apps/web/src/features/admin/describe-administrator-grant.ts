import { formatAdminDate } from "./format-admin-date";

const BOOTSTRAP_LABEL = "Initial administrator";
const GRANTED_BY_PREFIX = "Granted by";
const GRANTED_PREFIX = "Granted";

/**
 * One sentence describing where an administrator's access came from, so the
 * markup carries a single text node rather than fragments a reader has to
 * reassemble.
 */
export function describeAdministratorGrant(administrator: {
  source: string;
  grantedAt: string;
  grantedByName: string | null;
}): string {
  const on = formatAdminDate(administrator.grantedAt);
  if (administrator.source === "BOOTSTRAP") {
    return on ? `${BOOTSTRAP_LABEL} · ${on}` : BOOTSTRAP_LABEL;
  }
  if (administrator.grantedByName) {
    const by = `${GRANTED_BY_PREFIX} ${administrator.grantedByName}`;
    return on ? `${by} · ${on}` : by;
  }
  return on ? `${GRANTED_PREFIX} ${on}` : GRANTED_PREFIX;
}
