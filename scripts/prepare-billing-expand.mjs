import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("apps/web/prisma/migrations");
const target = resolve("apps/web/.billing-expand-migrations");
const contraction = "20261008110000_plus_only_contract";
// This directory is a generated migration cache, never a database or source tree.
// Rebuild it so an earlier staging run cannot leave contraction scripts behind.
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const entry of await readdir(source)) {
  if (/^\d/.test(entry) && entry >= contraction) continue;
  await cp(resolve(source, entry), resolve(target, entry), { recursive: true });
}
process.stdout.write("Prepared expansion migrations; contraction remains a separate post-rollout step.\n");
