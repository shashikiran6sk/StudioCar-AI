export const ADMIN_BOOTSTRAP_CONFIG_KEY = "admin.bootstrap";
export const ADMIN_BOOTSTRAP_LOCK_KEY = "admin-bootstrap";
export const ADMIN_MANAGEMENT_LOCK_KEY = "admin-management";

/** Seven days is long enough to act on and short enough to expire safely. */
export const ADMIN_INVITE_TTL_DAYS = 7;

export const AUDIT_RESOURCE_USER_ROLE = "UserRole";
export const AUDIT_RESOURCE_ADMIN_INVITE = "AdminInvite";
export const AUDIT_ACTION_INITIAL_ADMIN_BOOTSTRAPPED =
  "INITIAL_ADMIN_BOOTSTRAPPED";
export const AUDIT_ACTION_ADMIN_GRANTED = "ADMIN_GRANTED";
export const AUDIT_ACTION_ADMIN_REVOKED = "ADMIN_REVOKED";
export const AUDIT_ACTION_ADMIN_INVITED = "ADMIN_INVITED";
export const AUDIT_ACTION_ADMIN_INVITATION_REVOKED =
  "ADMIN_INVITATION_REVOKED";

export const ADMIN_PATH = "/admin";
export const ADMIN_NAVIGATION_LABEL = "Admin";
export const ADMIN_NAVIGATION_ICON = "⚙";

export const ADMIN_FORBIDDEN_STATUS = 403;
export const ADMIN_FORBIDDEN_CODE = "FORBIDDEN";
export const ADMIN_FORBIDDEN_MESSAGE =
  "This action requires administrator access.";

export const ADMIN_OVERVIEW_EYEBROW = "Administration";
export const ADMIN_OVERVIEW_TITLE = "Overview";
export const ADMIN_OVERVIEW_DESCRIPTION =
  "Internal configuration for plans, subscriptions, content, and administrators.";

export const ADMINS_PATH = "/admin/admins";
export const ADMINS_EYEBROW = "Administration";
export const ADMINS_TITLE = "Administrators";
export const ADMINS_DESCRIPTION =
  "Who can change plans, subscriptions, and content. Access is granted only to a verified Google identity.";

export const ADMIN_GRANT_LABEL = "Grant administrator access";
export const ADMIN_GRANT_EMAIL_LABEL = "Google email";
export const ADMIN_GRANT_SUBMIT_LABEL = "Grant access";
export const ADMIN_REVOKE_LABEL = "Revoke";
export const ADMIN_INVITE_REVOKE_LABEL = "Cancel invitation";

export const ADMIN_GRANTED_MESSAGE =
  "Administrator access granted to the verified Google account.";
export const ADMIN_ALREADY_ADMINISTRATOR_MESSAGE =
  "That account already has administrator access.";
export const ADMIN_INVITED_MESSAGE =
  "Nobody holds that verified Google address yet. The invitation activates when they sign in with it.";
export const ADMIN_ALREADY_INVITED_MESSAGE =
  "An invitation for that address is already waiting.";
export const ADMIN_REVOKED_MESSAGE = "Administrator access revoked.";
export const ADMIN_NOT_ADMINISTRATOR_MESSAGE =
  "That account does not have administrator access.";
export const ADMIN_LAST_ADMINISTRATOR_MESSAGE =
  "This is the only administrator. Grant access to somebody else before revoking it.";
export const ADMIN_INVITE_REVOKED_MESSAGE = "Invitation cancelled.";
export const ADMIN_INVALID_EMAIL_MESSAGE = "Enter a valid email address.";
export const ADMIN_ACTION_FAILED_MESSAGE =
  "That change could not be applied. Please try again.";
