const ACCESS_DENIED_MESSAGE = "Google sign-in was cancelled.";
const CHALLENGE_INVALID_MESSAGE =
  "That sign-in attempt expired or was already used. Please try again.";
const IDENTITY_LINK_REQUIRED_MESSAGE =
  "That email already belongs to an account. Sign in another way before linking Google.";
const GENERIC_AUTH_ERROR_MESSAGE =
  "We could not complete Google sign-in. Please try again.";
const VERIFIED_PHONE_EXPIRED_MESSAGE =
  "Phone verification expired. Verify your number again to continue.";
const PHONE_IDENTITY_TAKEN_MESSAGE =
  "This phone number was linked during setup. Verify it again to sign in.";
const GOOGLE_IDENTITY_CONFLICT_MESSAGE =
  "This Google account conflicts with another account. Sign in using its existing method before linking.";

export function googleAuthErrorMessage(code: string | undefined): string {
  if (code === "access_denied") return ACCESS_DENIED_MESSAGE;
  if (code === "challenge_invalid") return CHALLENGE_INVALID_MESSAGE;
  if (code === "identity_link_required") return IDENTITY_LINK_REQUIRED_MESSAGE;
  if (code === "verified_phone_expired") return VERIFIED_PHONE_EXPIRED_MESSAGE;
  if (code === "phone_identity_taken") return PHONE_IDENTITY_TAKEN_MESSAGE;
  if (code === "google_identity_conflict") return GOOGLE_IDENTITY_CONFLICT_MESSAGE;
  return GENERIC_AUTH_ERROR_MESSAGE;
}
