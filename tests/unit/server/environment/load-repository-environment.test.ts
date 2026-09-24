import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadRepositoryEnvironment } from "../../../../apps/web/src/server/environment/load-repository-environment";

function repository(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "studiocar-settings-"));
  writeFileSync(path.join(root, "pnpm-workspace.yaml"), "");
  mkdirSync(path.join(root, "apps", "web"), { recursive: true });
  for (const [file, content] of Object.entries(files)) {
    writeFileSync(path.join(root, file), content);
  }
  return path.join(root, "apps", "web");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("loadRepositoryEnvironment", () => {
  it("loads the repository-root .env.local", () => {
    vi.stubEnv("STUDIOCAR_TEST_SETTING", undefined);
    loadRepositoryEnvironment(
      repository({ ".env.local": "STUDIOCAR_TEST_SETTING=from-file\n" }),
    );

    expect(process.env["STUDIOCAR_TEST_SETTING"]).toBe("from-file");
  });

  it("never overrides a value the environment already carries", () => {
    vi.stubEnv("STUDIOCAR_TEST_SETTING", "from-deployment");
    loadRepositoryEnvironment(
      repository({ ".env.local": "STUDIOCAR_TEST_SETTING=from-file\n" }),
    );

    expect(process.env["STUDIOCAR_TEST_SETTING"]).toBe("from-deployment");
  });

  it("does nothing when there is no settings file, as in a deployment", () => {
    expect(() => {
      loadRepositoryEnvironment(repository({}));
    }).not.toThrow();
  });

  it.each([".env", ".env.local", ".env.production"])(
    "refuses a settings file left in apps/web (%s)",
    (file) => {
      expect(() => {
        loadRepositoryEnvironment(
          repository({ [`apps/web/${file}`]: "APP_ENV=development\n" }),
        );
      }).toThrow(/Environment settings found in apps\/web/);
    },
  );
});
