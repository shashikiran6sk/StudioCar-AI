import { describe, expect, it } from "vitest";

import { refineDatabaseIsolation } from "../../../packages/config/src/refine-database-isolation";
import { refinementIssues } from "./environment-fixtures";

const LOCAL_DATABASE = "postgresql://studiocar:studiocar@localhost:5432/studiocar";
const REMOTE_DATABASE = "postgresql://app:secret@db.studiocar.example:5432/studiocar";

describe("refineDatabaseIsolation", () => {
  it("keeps Local on the Docker database", () => {
    expect(
      refinementIssues(refineDatabaseIsolation, {
        APP_ENV: "local",
        DATABASE_URL: LOCAL_DATABASE,
      }),
    ).toEqual([]);
    expect(
      refinementIssues(refineDatabaseIsolation, {
        APP_ENV: "local",
        DATABASE_URL: REMOTE_DATABASE,
      }),
    ).toEqual([expect.stringMatching(/local Docker PostgreSQL/)]);
  });

  it("refuses a local database and the local credentials in production", () => {
    expect(
      refinementIssues(refineDatabaseIsolation, {
        APP_ENV: "production",
        DATABASE_URL: LOCAL_DATABASE,
      }),
    ).toEqual([
      expect.stringMatching(/must not address a local database/),
      expect.stringMatching(/local database credentials/),
    ]);
    expect(
      refinementIssues(refineDatabaseIsolation, {
        APP_ENV: "production",
        DATABASE_URL: REMOTE_DATABASE,
      }),
    ).toEqual([]);
  });

  it("refuses a production database in Development", () => {
    for (const databaseUrl of [
      "postgresql://app:secret@prod-db.studiocar.example:5432/studiocar",
      "postgresql://app:secret@db.studiocar.example:5432/studiocar_production",
    ]) {
      expect(
        refinementIssues(refineDatabaseIsolation, {
          APP_ENV: "development",
          DATABASE_URL: databaseUrl,
        }),
      ).toEqual([expect.stringMatching(/names a production database/)]);
    }
  });

  it("allows Development its own database, local or remote", () => {
    for (const databaseUrl of [LOCAL_DATABASE, REMOTE_DATABASE]) {
      expect(
        refinementIssues(refineDatabaseIsolation, {
          APP_ENV: "development",
          DATABASE_URL: databaseUrl,
        }),
      ).toEqual([]);
    }
  });

  it("ignores a runtime without a database", () => {
    expect(refinementIssues(refineDatabaseIsolation, { APP_ENV: "production" })).toEqual(
      [],
    );
  });
});
