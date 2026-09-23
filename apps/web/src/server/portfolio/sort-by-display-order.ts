/** Orders items as their photos were arranged, with a stable tie-break. */
export function sortByDisplayOrder<T extends { displayOrder: number; id: string }>(
  items: T[],
): T[] {
  return [...items].sort(
    (left, right) =>
      left.displayOrder - right.displayOrder || left.id.localeCompare(right.id),
  );
}
