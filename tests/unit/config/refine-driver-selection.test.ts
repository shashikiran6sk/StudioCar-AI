import { describe, expect, it } from "vitest";

import type { EnvironmentIssue } from "../../../packages/config/src/environment-isolation.types";
import { refineDriverSelection } from "../../../packages/config/src/refine-driver-selection";

function select(driver: string, allowed: readonly string[]): EnvironmentIssue[] {
  const issues: EnvironmentIssue[] = [];
  refineDriverSelection(
    { appEnvironment: "production", variable: "PHONE_OTP_DRIVER", driver, allowed },
    {
      addIssue: (issue) => {
        issues.push(issue);
      },
    },
  );
  return issues;
}

describe("refineDriverSelection", () => {
  it("accepts an allowed driver", () => {
    expect(select("msg91", ["msg91"])).toEqual([]);
  });

  it("names the variable, the environment, and what is allowed", () => {
    expect(select("fake", ["msg91"])).toEqual([
      {
        code: "custom",
        message:
          "PHONE_OTP_DRIVER=fake is not allowed in the production environment; allowed: msg91.",
        path: ["PHONE_OTP_DRIVER"],
      },
    ]);
  });
});
