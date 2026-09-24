import { describe, expect, it } from "vitest";

import {
  APP_ENVIRONMENT_VARIABLE,
  AppEnvironment,
} from "../../../packages/config/src/app-environment";

describe("AppEnvironment", () => {
  it("names exactly the three StudioCar environments", () => {
    expect(Object.values(AppEnvironment)).toEqual([
      "local",
      "development",
      "production",
    ]);
  });

  it("is selected by APP_ENV, never NODE_ENV", () => {
    expect(APP_ENVIRONMENT_VARIABLE).toBe("APP_ENV");
  });
});
