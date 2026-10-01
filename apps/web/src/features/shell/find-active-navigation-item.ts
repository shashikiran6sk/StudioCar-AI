import type { AppNavigationItem } from "./app-navigation.constants";
import { navigationItemIsActive } from "./navigation-item-is-active";

/** The destination the current page belongs to, if it is one of `items`. */
export function findActiveNavigationItem(
  pathname: string | null,
  items: readonly AppNavigationItem[],
): AppNavigationItem | undefined {
  return items.find((item) => navigationItemIsActive(pathname, item.href));
}
