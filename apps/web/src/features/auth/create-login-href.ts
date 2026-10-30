import { LOGIN_PATH, RETURN_TO_QUERY_KEY } from "../../app/app-routes";

/** Sign-in that continues to `returnTo` once the visitor is authenticated. */
export function createLoginHref(returnTo: string): string {
  const query = new URLSearchParams({ [RETURN_TO_QUERY_KEY]: returnTo });
  return `${LOGIN_PATH}?${query.toString()}`;
}
