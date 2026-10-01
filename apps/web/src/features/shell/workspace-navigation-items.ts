import {
  ADMIN_NAVIGATION_ITEM,
  APP_NAVIGATION_ITEMS,
  type AppNavigationItem,
} from "./app-navigation.constants";

/**
 * The destinations a workspace member may see. The desktop sidebar and the
 * mobile navigation drawer both read this list, so they cannot drift apart.
 */
export function workspaceNavigationItems(
  showAdmin: boolean,
): readonly AppNavigationItem[] {
  return showAdmin
    ? [...APP_NAVIGATION_ITEMS, ADMIN_NAVIGATION_ITEM]
    : APP_NAVIGATION_ITEMS;
}
