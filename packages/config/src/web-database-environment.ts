import { z } from "zod";
import { parseSessionEnvironment } from "./environment";

const DEFAULT_WEB_DATABASE_POOL_SIZE = 5;
const MAXIMUM_WEB_DATABASE_POOL_SIZE = 20;
const WebPoolSchema = z.object({
  WEB_DATABASE_POOL_SIZE: z.coerce.number().int().min(1)
    .max(MAXIMUM_WEB_DATABASE_POOL_SIZE).default(DEFAULT_WEB_DATABASE_POOL_SIZE),
});

/** Web-only pool controls; retain the existing database isolation validation. */
export function parseWebDatabaseEnvironment(values: Record<string, string | undefined>) {
  return { ...parseSessionEnvironment(values), ...WebPoolSchema.parse(values) };
}
