import { z } from "zod";

import { AppEnvironmentSchema } from "./app-environment-schema";

const SeoEnvironmentSchema = z.object({
  // A preview build may have no application profile. SEO must fail closed there
  // without relaxing the required APP_ENV checks for the actual application.
  APP_ENV: AppEnvironmentSchema.optional(),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  GOOGLE_SITE_VERIFICATION: z.string().trim().min(1).optional(),
});

export function parseSeoEnvironment(environment: Record<string, string | undefined>) {
  return SeoEnvironmentSchema.parse(environment);
}
