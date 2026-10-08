import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

it("stages only expansion migrations and removes stale contraction cache on repeated runs", async () => {
  const scratch = await mkdtemp(path.join(tmpdir(), "studiocar-expand-"));
  const migrations = path.join(scratch, "apps/web/prisma/migrations");
  const target = path.join(scratch, "apps/web/.billing-expand-migrations");
  const earlier = "20261008100000_plus_only_expand";
  const contract = "20261008110000_plus_only_contract";
  const later = "20261008140000_remove_unused_provider_price";
  try {
    for (const name of [earlier, contract, later]) {
      await mkdir(path.join(migrations, name), { recursive: true });
      await writeFile(path.join(migrations, name, "migration.sql"), `-- ${name}\n`);
    }
    await writeFile(path.join(migrations, "migration_lock.toml"), 'provider = "postgresql"\n');
    const script = path.resolve(__dirname, "../../../../scripts/prepare-billing-expand.mjs");
    execFileSync(process.execPath, [script], { cwd: scratch });
    expect((await readdir(target)).sort()).toEqual([earlier, "migration_lock.toml"]);
    expect(await readFile(path.join(target, earlier, "migration.sql"), "utf8")).toBe(`-- ${earlier}\n`);
    await mkdir(path.join(target, contract));
    execFileSync(process.execPath, [script], { cwd: scratch });
    expect((await readdir(target)).sort()).toEqual([earlier, "migration_lock.toml"]);
    expect((await readdir(migrations)).sort()).toEqual([earlier, contract, later, "migration_lock.toml"]);
  } finally { await rm(scratch, { recursive: true, force: true }); }
});
