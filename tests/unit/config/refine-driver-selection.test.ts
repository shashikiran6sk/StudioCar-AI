import { describe, expect, it } from "vitest";

import type { EnvironmentIssue } from "../../../packages/config/src/environment-isolation.types";
import { refineDriverSelection } from "../../../packages/config/src/refine-driver-selection";

function select(driver: string, allowed: readonly string[]): EnvironmentIssue[] {
  const issues: EnvironmentIssue[] = [];
  refineDriverSelection(
    { appEnvironment: "production", variable: "EMAIL_DRIVER", driver, allowed },
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
    expect(select("resend", ["resend"])).toEqual([]);
  });

  it("names the variable, the environment, and what is allowed", () => {
    expect(select("mailpit", ["resend"])).toEqual([
      {
        code: "custom",
        message:
          "EMAIL_DRIVER=mailpit is not allowed in the production environment; allowed: resend.",
        path: ["EMAIL_DRIVER"],
      },
    ]);
  });
});
