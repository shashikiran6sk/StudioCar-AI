import { describe, expect, it } from "vitest";

import {
  PlanConfigurationFormSchema,
  readPlanConfigurationForm,
} from "../../../../apps/web/src/server/plans/plan-configuration-form";

function submission(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  const fields: Record<string, string> = {
    active: "on",
    billingInterval: "MONTHLY",
    description: "For high-volume teams.",
    displayName: "Studio Plus",
    displayOrder: "3",
    features: "1,500 images each month\n\nUp to 20 images per batch\n",
    includedImages: "1500",
    maxImagesPerBatch: "20",
    priceRupees: "7999",
    segment: "Scale",
    storageGigabytes: "",
    ...overrides,
  };
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }
  return formData;
}

function parse(overrides?: Record<string, string>) {
  return PlanConfigurationFormSchema.safeParse(
    readPlanConfigurationForm(submission(overrides)),
  );
}

describe("PlanConfigurationFormSchema", () => {
  it("stores an entered rupee price in paise", () => {
    const result = parse();

    expect(result.success && result.data.priceMinorUnits).toBe(799_900);
  });

  it("stores entered gigabytes as bytes", () => {
    const result = parse({ storageGigabytes: "3" });

    expect(result.success && result.data.storageBytes).toBe(3_221_225_472);
  });

  it("treats blank storage as no limit rather than as none", () => {
    const result = parse();

    expect(result.success && result.data.storageBytes).toBeNull();
  });

  it("drops blank lines from the feature list", () => {
    const result = parse();

    expect(result.success && result.data.features).toEqual([
      "1,500 images each month",
      "Up to 20 images per batch",
    ]);
  });

  it("reads an absent checkbox as off", () => {
    const formData = submission();
    formData.delete("active");

    const result = PlanConfigurationFormSchema.safeParse(
      readPlanConfigurationForm(formData),
    );

    expect(result.success && result.data.active).toBe(false);
    expect(result.success && result.data.featured).toBe(false);
    expect(result.success && result.data.purchasable).toBe(false);
  });

  it("refuses a batch larger than the plan's whole allowance", () => {
    // The database's CHECK constraint mirrors this, so neither can be bypassed.
    expect(parse({ includedImages: "10", maxImagesPerBatch: "20" }).success).toBe(
      false,
    );
  });

  it("refuses an allowance of zero images", () => {
    expect(parse({ includedImages: "0", maxImagesPerBatch: "0" }).success).toBe(
      false,
    );
  });

  it("refuses a negative price rather than coercing it", () => {
    expect(parse({ priceRupees: "-100" }).success).toBe(false);
  });

  it("refuses a price that is not a whole number of rupees", () => {
    expect(parse({ priceRupees: "79.99" }).success).toBe(false);
  });

  it("refuses an interval the product does not understand", () => {
    expect(parse({ billingInterval: "WEEKLY" }).success).toBe(false);
  });

  it("refuses an empty display name", () => {
    expect(parse({ displayName: "   " }).success).toBe(false);
  });

  it("trims what an administrator typed", () => {
    const result = parse({ displayName: "  Studio Plus  " });

    expect(result.success && result.data.displayName).toBe("Studio Plus");
  });
});

describe("readPlanConfigurationForm", () => {
  it("treats a non-text value as absent rather than coercing it", () => {
    const formData = submission();
    formData.set("priceRupees", new File([], "price.txt"));

    expect(readPlanConfigurationForm(formData).priceRupees).toBeNull();
  });
});
