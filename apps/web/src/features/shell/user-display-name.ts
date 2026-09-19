import type { AuthUser } from "@studiocar/contracts";

const DEFAULT_USER_NAME = "StudioCar user";

export function userDisplayName(user: AuthUser): string {
  return (
    user.displayName ??
    user.primaryEmail ??
    user.primaryPhone ??
    DEFAULT_USER_NAME
  );
}
