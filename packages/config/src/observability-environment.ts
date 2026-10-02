import { z } from "zod";
import { AppEnvironmentSchema } from "./app-environment-schema";
import { emptyAsUnset } from "./empty-as-unset";

export const ObservabilityEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema.optional(),
    SENTRY_DSN: emptyAsUnset(z.url({ protocol: /^https$/ })),
    SENTRY_RELEASE: emptyAsUnset(z.string().regex(/^[A-Za-z0-9._@/-]{1,128}$/)),
    HTTP_CLOUDWATCH_METRICS_ENABLED: emptyAsUnset(
      z.enum(["true", "false"]),
    ).default("false"),
    AWS_REGION: emptyAsUnset(z.string().regex(/^[a-z]{2}(?:-gov)?-[a-z]+-\d$/)),
  })
  .strip()
  .superRefine((value, context) => {
    if (
      (value.SENTRY_DSN || value.HTTP_CLOUDWATCH_METRICS_ENABLED === "true") &&
      !value.APP_ENV
    ) {
      context.addIssue({
        code: "custom",
        path: ["APP_ENV"],
        message: "APP_ENV is required for external observability.",
      });
    }
    if (value.HTTP_CLOUDWATCH_METRICS_ENABLED === "true" && !value.AWS_REGION) {
      context.addIssue({
        code: "custom",
        path: ["AWS_REGION"],
        message: "AWS_REGION is required for CloudWatch HTTP metrics.",
      });
    }
  });

export function parseObservabilityEnvironment(
  values: Record<string, string | undefined>,
) {
  return ObservabilityEnvironmentSchema.parse(values);
}
