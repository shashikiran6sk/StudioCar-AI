import { describe, expect, it } from "vitest";

import { dashboardGreeting } from "../../../../apps/web/src/features/dashboard/dashboard-greeting";

describe("dashboardGreeting", () => {
  it.each([
    [new Date(2026, 8, 19, 8), "Good morning"],
    [new Date(2026, 8, 19, 14), "Good afternoon"],
    [new Date(2026, 8, 19, 20), "Good evening"],
  ])("selects a greeting for the local time", (date, expected) => {
    expect(dashboardGreeting(date)).toBe(expected);
  });
});
