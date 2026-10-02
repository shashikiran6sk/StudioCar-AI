import { expect, it } from "vitest";
import { parseWebDatabaseEnvironment } from "../../../packages/config/src/web-database-environment";

it("defaults to a bounded web pool and strips unrelated secrets", () => {
  const result = parseWebDatabaseEnvironment({ APP_ENV: "local", LEONARDO_API_KEY: "private" });
  expect(result.WEB_DATABASE_POOL_SIZE).toBe(5);
  expect(result).not.toHaveProperty("LEONARDO_API_KEY");
});
it.each(["0", "21", "2.5", "NaN", ""])("refuses invalid pool size %s", (size) => {
  expect(() => parseWebDatabaseEnvironment({ APP_ENV: "local", WEB_DATABASE_POOL_SIZE: size })).toThrow();
});
it("accepts an explicit pool and preserves environment isolation", () => {
  expect(parseWebDatabaseEnvironment({ APP_ENV: "local", WEB_DATABASE_POOL_SIZE: "2" }).WEB_DATABASE_POOL_SIZE).toBe(2);
  expect(() => parseWebDatabaseEnvironment({ APP_ENV: "production", DATABASE_URL: "postgresql://test:test@localhost/test" })).toThrow();
});
