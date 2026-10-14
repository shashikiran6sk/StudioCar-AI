import { defineConfig } from "prisma/config";
import base from "./prisma.config";

export default defineConfig({ ...base, migrations: { path: ".billing-expand-migrations" } });
