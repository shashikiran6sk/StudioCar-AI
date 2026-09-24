/**
 * The StudioCar deployment environment, selected by `APP_ENV`.
 *
 * This is deliberately separate from `NODE_ENV`, which keeps its ordinary
 * Node.js and Next.js meaning (how the code was built and is being run). An
 * optimised production build may legitimately run against Development
 * infrastructure, so nothing that chooses infrastructure or a provider may read
 * `NODE_ENV`.
 *
 * This module has no imports on purpose: repository scripts load it directly
 * with Node's type stripping, without a build step.
 */
export const AppEnvironment = {
  Local: "local",
  Development: "development",
  Production: "production",
} as const;

export type AppEnvironment = (typeof AppEnvironment)[keyof typeof AppEnvironment];

export const APP_ENVIRONMENT_VARIABLE = "APP_ENV";
