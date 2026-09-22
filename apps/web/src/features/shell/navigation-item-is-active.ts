/**
 * A vehicle portfolio lives under the inventory path, so the inventory item
 * stays current while one is open. Matching on the exact path alone would make
 * the sidebar claim no destination is active.
 */
export function navigationItemIsActive(
  pathname: string | null,
  href: string,
): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
