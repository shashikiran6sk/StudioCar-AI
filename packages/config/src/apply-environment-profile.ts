import { APP_ENVIRONMENT_VARIABLE } from "./app-environment";
import { AppEnvironmentSchema } from "./app-environment-schema";
import { getProfileDefaults, type ProfileDefaultGroup } from "./profile-defaults";

export type EnvironmentValues = Record<string, string | undefined>;

/**
 * Lays the selected profile's defaults under the values actually configured.
 *
 * An explicit value always wins. An empty one counts as not set, matching how
 * every optional setting is read, so a blank line in a settings file or an
 * empty compose substitution falls back to the profile rather than erasing it.
 *
 * An all-or-nothing group contributes nothing once any of its settings is
 * configured, so a partial override cannot inherit the rest of a target it
 * moved away from.
 *
 * An absent or unknown `APP_ENV` applies nothing: the runtime schema then
 * rejects it by name. No environment is ever assumed.
 */
export function applyEnvironmentProfile(
  values: EnvironmentValues,
): EnvironmentValues {
  const appEnvironment = AppEnvironmentSchema.safeParse(
    values[APP_ENVIRONMENT_VARIABLE],
  );
  if (!appEnvironment.success) return values;

  const configured = Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) => value !== undefined && value.trim() !== "",
    ),
  );

  const applicable = (group: ProfileDefaultGroup): boolean =>
    !group.allOrNothing ||
    Object.keys(group.values).every((key) => !(key in configured));
  const defaults = getProfileDefaults(appEnvironment.data)
    .filter(applicable)
    .reduce<EnvironmentValues>(
      (merged, group) => ({ ...merged, ...group.values }),
      {},
    );

  return { ...defaults, ...configured };
}
