import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import UsageBillingPage from "../../../../../../apps/web/src/app/(app)/settings/billing/page";
import { getCurrentSession } from "../../../../../../apps/web/src/server/auth/get-current-session";
import { getUsageBillingSummary } from "../../../../../../apps/web/src/server/billing/get-usage-billing-summary";
import { getBillingStatus } from "../../../../../../apps/web/src/server/billing/get-billing-status";
import { DEFAULT_PLAN_CATALOG } from "../../../../../../apps/web/src/server/plans/default-plan-catalog";
import { getPlanCatalog } from "../../../../../../apps/web/src/server/plans/get-plan-catalog";

vi.mock("../../../../../../apps/web/src/server/auth/get-current-session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }), redirect: vi.fn() }));
vi.mock("../../../../../../apps/web/src/server/billing/get-usage-billing-summary", () => ({ getUsageBillingSummary: vi.fn() }));
vi.mock("../../../../../../apps/web/src/server/billing/get-billing-status", () => ({ getBillingStatus: vi.fn() }));
vi.mock("../../../../../../apps/web/src/server/billing/billing-runtime", () => ({ getBillingRuntime: () => ({ database: { payment: { findMany: async () => [] } } }) }));
vi.mock("../../../../../../apps/web/src/server/plans/get-plan-catalog", () => ({ getPlanCatalog: vi.fn() }));

describe("UsageBillingPage", () => {
  it("renders owned immutable usage in the plan surface", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({ id: "session-1", userId: "user-1", expiresAt: new Date("2027-01-01"), user: { id: "user-1", displayName: "Priya", primaryEmail: "priya@example.com", primaryPhone: null } });
    vi.mocked(getPlanCatalog).mockResolvedValue(DEFAULT_PLAN_CATALOG);
    vi.mocked(getUsageBillingSummary).mockResolvedValue({ currentPlan: { allowanceScope: "LIFETIME", description: "Small batches.", imageCapacity: 15, key: "FREE", maxImagesPerBatch: 5, name: "Free", storageCapacityBytes: 3_221_225_472, uploadSessionCapacity: null }, imagesRemaining: 13, imagesUsed: 2, storageUsedBytes: 1_024, uploadSessionsRemaining: null, uploadSessionsUsed: 1 });
    vi.mocked(getBillingStatus).mockResolvedValue({ subscription: null, purchasedCredits: 0, purchasedCreditsGranted: 0 });

    render(await UsageBillingPage());
    expect(screen.getByRole("heading", { name: "Usage & Billing" })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upgrade plan" })).toHaveAttribute("href", "#packs");
  });
});
