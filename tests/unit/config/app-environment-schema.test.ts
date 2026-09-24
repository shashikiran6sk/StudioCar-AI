import { describe, expect, it } from "vitest";

import { AppEnvironmentSchema } from "../../../packages/config/src/app-environment-schema";

describe("AppEnvironmentSchema", () => {
  it.each(["local", "development", "production"])("accepts %s", (value) => {
    expect(AppEnvironmentSchema.parse(value)).toBe(value);
  });

  it.each([undefined, "", "test", "staging", "Production"])(
    "refuses %s rather than assuming an environment",
    (value) => {
      const result = AppEnvironmentSchema.safeParse(value);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toMatch(
        /APP_ENV must be one of local, development, or production/,
      );
    },
  );
});
