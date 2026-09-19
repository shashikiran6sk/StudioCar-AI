const MAXIMUM_INITIALS = 2;
const FALLBACK_INITIALS = "SC";

export function userInitials(displayName: string): string {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAXIMUM_INITIALS)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || FALLBACK_INITIALS;
}
