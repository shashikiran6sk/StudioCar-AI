export const GOOGLE_ISSUER = "https://accounts.google.com";
export const GOOGLE_OIDC_SCOPE = "openid email profile";
export const GOOGLE_OAUTH_RESPONSE_TYPE = "code";
export const GOOGLE_PKCE_METHOD = "S256";
export const GOOGLE_AUTH_ERROR_PATH = "/auth/error";
export const GOOGLE_AUTH_ERROR_QUERY_KEY = "code";
export const GOOGLE_AUTH_RETURN_TO_QUERY_KEY = "returnTo";
export const GOOGLE_OAUTH_CODE_QUERY_KEY = "code";
export const GOOGLE_OAUTH_ERROR_QUERY_KEY = "error";
export const GOOGLE_OAUTH_ERROR_DESCRIPTION_QUERY_KEY = "error_description";
export const GOOGLE_OAUTH_STATE_QUERY_KEY = "state";
export const GOOGLE_AUTH_INTENT_QUERY_KEY = "intent";
export const GOOGLE_AUTH_LINK_INTENT = "link";
export const GOOGLE_AUTH_LINKED_QUERY_KEY = "linked";
export const GOOGLE_AUTH_LINKED_VALUE = "google";
export const UNAUTHENTICATED_STATUS = 401;
export const API_UNAUTHENTICATED_CODE = "UNAUTHENTICATED";
export const LINK_REQUIRES_SESSION_MESSAGE =
  "Sign in before connecting another sign-in method.";
export const OAUTH_REDIRECT_STATUS = 303;
export const OAUTH_START_REDIRECT_STATUS = 302;
export const BAD_REQUEST_STATUS = 400;
export const SERVICE_UNAVAILABLE_STATUS = 503;
export const BAD_REQUEST_MESSAGE = "The Google sign-in request is invalid.";
export const SERVICE_UNAVAILABLE_MESSAGE = "Google sign-in is temporarily unavailable.";
export const API_BAD_REQUEST_CODE = "BAD_REQUEST";
export const API_SERVICE_UNAVAILABLE_CODE = "SERVICE_UNAVAILABLE";

export enum GoogleAuthRedirectErrorCode {
  AccessDenied = "access_denied",
  ChallengeInvalid = "challenge_invalid",
  IdentityLinkRequired = "identity_link_required",
  InvalidCallback = "invalid_callback",
  ProviderFailed = "provider_failed",
  InternalError = "internal_error",
  LinkSessionMismatch = "link_session_mismatch",
  LinkIdentityTaken = "link_identity_taken",
}
