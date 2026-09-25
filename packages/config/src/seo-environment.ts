import { z } from "zod";

import { AppEnvironmentSchema } from "./app-environment-schema";

const SeoEnvironmentSchema = z.object({
  APP_ENV: AppEnvironmentSchema,
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  GOOGLE_SITE_VERIFICATION: z.string().trim().min(1).optional(),
});

export function parseSeoEnvironment(environment: Record<string, string | undefined>) {
  return SeoEnvironmentSchema.parse(environment);
}
