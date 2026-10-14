import { z } from "zod";

const DEV_HOSTNAME_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const DEV_HOSTNAME_ERROR = "DEV_ALLOWED_ORIGINS must contain exact hostnames, without schemes, ports, paths or wildcards.";

/** Explicit browser hosts allowed to load Next.js development assets. */
export const DevServerEnvironmentSchema = z.object({
  DEV_ALLOWED_ORIGINS: z.string().optional()
    .transform((value) => value?.split(",").map((host) => host.trim()).filter(Boolean) ?? [])
    .pipe(z.array(z.string().regex(DEV_HOSTNAME_PATTERN, DEV_HOSTNAME_ERROR))),
}).strip();

export function parseDevServerEnvironment(environment: Record<string, string | undefined>) {
  return DevServerEnvironmentSchema.parse(environment);
}
