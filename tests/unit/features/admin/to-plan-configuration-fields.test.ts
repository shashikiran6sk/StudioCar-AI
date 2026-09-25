import { describe, expect, it } from "vitest";

import { toPlanConfigurationFields } from "../../../../apps/web/src/features/admin/to-plan-configuration-fields";
import {
  DEFAULT_PLAN_CATALOG,
  FALLBACK_PLAN_ENTRY,
} from "../../../../apps/web/src/server/plans/default-plan-catalog";

describe("toPlanConfigurationFields", () => {
  it("shows a stored paise price in the rupees an administrator types", () => {
    const plus = DEFAULT_PLAN_CATALOG.find(
      (plan) => plan.planKey === "STUDIO_PLUS",
    );

    expect(plus && toPlanConfigurationFields(plus).priceRupees).toBe("1999");
  });

  it("shows stored bytes as gigabytes", () => {
    expect(toPlanConfigurationFields(FALLBACK_PLAN_ENTRY).storageGigabytes).toBe(
      "3",
    );
  });

  it("leaves unlimited storage blank rather than showing a zero", () => {
    expect(
      toPlanConfigurationFields({ ...FALLBACK_PLAN_ENTRY, storageBytes: null })
        .storageGigabytes,
    ).toBe("");
  });

  it("puts one feature on each line of the textarea", () => {
    expect(toPlanConfigurationFields(FALLBACK_PLAN_ENTRY).features).toBe(
      FALLBACK_PLAN_ENTRY.features.join("\n"),
    );
  });
});
