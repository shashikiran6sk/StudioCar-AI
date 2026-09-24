import {
  GOOGLE_AUTH_START_PATH,
  RETURN_TO_QUERY_KEY,
} from "../../app/app-routes";
import {
  GOOGLE_AUTH_INTENT_QUERY_KEY,
  GOOGLE_AUTH_VERIFIED_PHONE_INTENT,
} from "../../server/auth/google/google-auth.constants";

export function createGoogleVerifiedPhoneLinkHref(returnTo: string): string {
  const query = new URLSearchParams({
    [GOOGLE_AUTH_INTENT_QUERY_KEY]: GOOGLE_AUTH_VERIFIED_PHONE_INTENT,
    [RETURN_TO_QUERY_KEY]: returnTo,
  });
  return `${GOOGLE_AUTH_START_PATH}?${query.toString()}`;
}
