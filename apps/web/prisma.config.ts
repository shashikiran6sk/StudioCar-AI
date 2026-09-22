import { defineConfig } from "prisma/config";

try {
  // Prisma 7 stops reading `.env` itself once this file exists. The commands
  // run in this directory, which is where `.env` lives, so the default path is
  // the right one. A missing file is the CI case, where variables are already
  // set, and a variable that is set always wins over the file.
  process.loadEnvFile();
} catch {
  /* No `.env`; the environment is expected to carry the values. */
}

const databaseUrl = process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
