import { describe, expect, it } from "vitest";

import { describeAccountPlan } from "../../../../apps/web/src/features/admin/describe-account-plan";

describe("describeAccountPlan", () => {
  it("names the plan an account is on", () => {
    expect(
      describeAccountPlan({ planName: "Free", providerManaged: false }),
    ).toBe("On Free.");
  });

  it("says when a provider owns it, so nobody edits it here", () => {
    expect(
      describeAccountPlan({ planName: "Studio Pro", providerManaged: true }),
    ).toBe("On Studio Pro, owned by the billing provider.");
  });
});
