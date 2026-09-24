import { applyEnvironmentProfile } from "@studiocar/config";
import { defineConfig } from "prisma/config";

import { loadRepositoryEnvironment } from "./src/server/environment/load-repository-environment";

// Prisma 7 stops reading `.env` itself once this file exists. Every command
// reads the repository-root `.env.local` instead, the same file the
// application reads; a variable already set always wins, and a missing file is
// the CI case. The Local profile supplies the Docker database address.
loadRepositoryEnvironment(process.cwd());

const databaseUrl = applyEnvironmentProfile(process.env)["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
