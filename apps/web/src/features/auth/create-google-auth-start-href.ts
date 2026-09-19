import {
  GOOGLE_AUTH_START_PATH,
  RETURN_TO_QUERY_KEY,
} from "../../app/app-routes";

export function createGoogleAuthStartHref(returnTo: string): string {
  const query = new URLSearchParams({ [RETURN_TO_QUERY_KEY]: returnTo });
  return `${GOOGLE_AUTH_START_PATH}?${query.toString()}`;
}
