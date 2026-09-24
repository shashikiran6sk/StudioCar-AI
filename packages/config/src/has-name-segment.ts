const NAME_SEGMENT_SEPARATOR = /[^a-z0-9]+/;

/**
 * Whether a resource name carries one of the given segments as a whole word.
 * `studiocar-prod-images` carries `prod`; `studiocar-product-images` does not.
 */
export function hasNameSegment(
  name: string,
  segments: readonly string[],
): boolean {
  return name
    .toLowerCase()
    .split(NAME_SEGMENT_SEPARATOR)
    .some((segment) => segments.includes(segment));
}
