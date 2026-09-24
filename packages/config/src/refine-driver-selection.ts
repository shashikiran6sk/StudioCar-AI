import type { AppEnvironment } from "./app-environment";
import type { EnvironmentIssueSink } from "./environment-isolation.types";

/**
 * Refuses a driver the environment profile does not allow. This is what stops
 * a missing or copied setting from quietly selecting a local adapter where a
 * real provider is required.
 */
export function refineDriverSelection<T extends string>(
  selection: {
    appEnvironment: AppEnvironment;
    variable: string;
    driver: T;
    allowed: readonly T[];
  },
  context: EnvironmentIssueSink,
): void {
  if (selection.allowed.includes(selection.driver)) return;

  context.addIssue({
    code: "custom",
    message: `${selection.variable}=${selection.driver} is not allowed in the ${selection.appEnvironment} environment; allowed: ${selection.allowed.join(", ")}.`,
    path: [selection.variable],
  });
}
