import { z } from "zod";

import { AppEnvironment } from "./app-environment";

/**
 * `APP_ENV` is required everywhere it is read. A missing value is a
 * configuration error rather than a quiet assumption of any environment,
 * least of all Local.
 */
export const AppEnvironmentSchema = z.enum(AppEnvironment, {
  error: () =>
    "APP_ENV must be one of local, development, or production. Copy the matching .env.example.<environment> file to start.",
});
