/**
 * Returns `filename`, or `name-2.ext`, `name-3.ext` and so on when an earlier
 * entry already took it. Records the returned name in `taken`.
 */
export function createUniqueFilename(filename: string, taken: Set<string>): string {
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const extension = dot > 0 ? filename.slice(dot) : "";
  let candidate = filename;
  for (let copy = 2; taken.has(candidate); copy += 1) {
    candidate = `${stem}-${String(copy)}${extension}`;
  }
  taken.add(candidate);
  return candidate;
}
