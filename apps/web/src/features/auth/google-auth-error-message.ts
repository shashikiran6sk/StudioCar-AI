const ACCESS_DENIED_MESSAGE = "Google sign-in was cancelled.";
const CHALLENGE_INVALID_MESSAGE =
  "That sign-in attempt expired or was already used. Please try again.";
const IDENTITY_LINK_REQUIRED_MESSAGE =
  "That email already belongs to an account. Sign in another way before linking Google.";
const GENERIC_AUTH_ERROR_MESSAGE =
  "We could not complete Google sign-in. Please try again.";

export function googleAuthErrorMessage(code: string | undefined): string {
  if (code === "access_denied") return ACCESS_DENIED_MESSAGE;
  if (code === "challenge_invalid") return CHALLENGE_INVALID_MESSAGE;
  if (code === "identity_link_required") return IDENTITY_LINK_REQUIRED_MESSAGE;
  return GENERIC_AUTH_ERROR_MESSAGE;
}
