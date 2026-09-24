import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { findRepositoryRoot } from "../../../../apps/web/src/server/environment/find-repository-root";

describe("findRepositoryRoot", () => {
  it("walks up to the directory holding the workspace file", () => {
    const root = mkdtempSync(path.join(tmpdir(), "studiocar-root-"));
    writeFileSync(path.join(root, "pnpm-workspace.yaml"), "");
    const application = path.join(root, "apps", "web");
    mkdirSync(application, { recursive: true });

    expect(findRepositoryRoot(application)).toBe(root);
    expect(findRepositoryRoot(root)).toBe(root);
  });

  it("finds this repository from the application directory", () => {
    const repository = path.resolve(import.meta.dirname, "../../../..");

    expect(findRepositoryRoot(path.join(repository, "apps", "web"))).toBe(repository);
  });

  it("fails when there is no repository above the directory", () => {
    expect(() => findRepositoryRoot(path.parse(tmpdir()).root)).toThrow(
      /Could not find the repository root/,
    );
  });
});
