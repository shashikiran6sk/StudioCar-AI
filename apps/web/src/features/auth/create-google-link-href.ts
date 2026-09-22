import {
  GOOGLE_AUTH_START_PATH,
  RETURN_TO_QUERY_KEY,
} from "../../app/app-routes";
import { GOOGLE_LINK_INTENT_QUERY_KEY, GOOGLE_LINK_INTENT_VALUE } from "./phone-sign-in.constants";

/**
 * Starts Google sign-in with the intent to connect it to the signed-in account
 * rather than to sign somebody in. The server refuses this without a session
 * and records the intent inside the encrypted challenge, not the URL.
 */
export function createGoogleLinkHref(returnTo: string): string {
  const query = new URLSearchParams({
    [RETURN_TO_QUERY_KEY]: returnTo,
    [GOOGLE_LINK_INTENT_QUERY_KEY]: GOOGLE_LINK_INTENT_VALUE,
  });
  return `${GOOGLE_AUTH_START_PATH}?${query.toString()}`;
}
