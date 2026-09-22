import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const requireAdministrator = vi.fn();
const getPlanCatalog = vi.fn();
const findAccountByVerifiedContact = vi.fn();
const findLivePlan = vi.fn();
const listActive = vi.fn();

vi.mock(
  "../../../../../../apps/web/src/server/admin/require-administrator",
  () => ({ requireAdministrator }),
);
vi.mock("../../../../../../apps/web/src/server/plans/get-plan-catalog", () => ({
  getPlanCatalog,
  getFullPlanCatalog: vi.fn(),
}));
vi.mock(
  "../../../../../../apps/web/src/server/admin/manual-subscription-runtime",
  () => ({
    getManualSubscriptionRepository: () => ({
      findAccountByVerifiedContact,
      findLivePlan,
      listActive,
    }),
  }),
);
vi.mock(
  "../../../../../../apps/web/src/server/admin/manual-subscription-actions",
  () => ({
    assignSubscriptionAction: vi.fn(),
    revokeSubscriptionAction: vi.fn(),
  }),
);

const { default: AdminSubscriptionsPage } = await import(
  "../../../../../../apps/web/src/app/(app)/admin/subscriptions/page"
);
const { DEFAULT_PLAN_CATALOG } = await import(
  "../../../../../../apps/web/src/server/plans/default-plan-catalog"
);

const ACCOUNT = {
  displayName: "Priya",
  email: "priya@example.com",
  phoneNumber: null,
  userId: "2b8f0ad2-1c37-4a0d-9b93-9b0e1a1f2c34",
};

function ready() {
  requireAdministrator.mockResolvedValue({ userId: "admin-1" });
  getPlanCatalog.mockResolvedValue(DEFAULT_PLAN_CATALOG);
  listActive.mockResolvedValue([]);
  findLivePlan.mockResolvedValue(null);
}

function searchParams(params: Record<string, string> = {}) {
  return Promise.resolve(params);
}

describe("AdminSubscriptionsPage", () => {
  it("authorizes for itself before reading anything", async () => {
    vi.clearAllMocks();
    requireAdministrator.mockRejectedValue(new Error("NOT_FOUND"));

    await expect(
      AdminSubscriptionsPage({ searchParams: searchParams() }),
    ).rejects.toThrow("NOT_FOUND");
    expect(listActive).not.toHaveBeenCalled();
    expect(findAccountByVerifiedContact).not.toHaveBeenCalled();
  });

  it("looks nobody up until an address is given", async () => {
    vi.clearAllMocks();
    ready();

    render(await AdminSubscriptionsPage({ searchParams: searchParams() }));

    expect(findAccountByVerifiedContact).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", { name: "Assign a plan" }),
    ).not.toBeInTheDocument();
  });

  it("offers every paid plan for a found account, and never Free", async () => {
    vi.clearAllMocks();
    ready();
    findAccountByVerifiedContact.mockResolvedValue(ACCOUNT);

    render(
      await AdminSubscriptionsPage({
        searchParams: searchParams({ account: "priya@example.com" }),
      }),
    );

    expect(findAccountByVerifiedContact).toHaveBeenCalledWith({
      email: "priya@example.com",
    });
    expect(screen.getByText("Priya — On Free.")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Studio Plus" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Free" })).not.toBeInTheDocument();
  });

  it("says when a provider owns the subscription", async () => {
    vi.clearAllMocks();
    ready();
    findAccountByVerifiedContact.mockResolvedValue(ACCOUNT);
    findLivePlan.mockResolvedValue({
      planKey: "STUDIO_PRO",
      providerManaged: true,
    });

    render(
      await AdminSubscriptionsPage({
        searchParams: searchParams({ account: "priya@example.com" }),
      }),
    );

    expect(
      screen.getByText("Priya — On Studio Pro, owned by the billing provider."),
    ).toBeInTheDocument();
    // The control agrees with the sentence above it.
    expect(screen.getByLabelText(/^Plan$/)).toHaveValue("STUDIO_PRO");
  });

  it("reports a lookup that matches nobody", async () => {
    vi.clearAllMocks();
    ready();
    findAccountByVerifiedContact.mockResolvedValue(null);

    render(
      await AdminSubscriptionsPage({
        searchParams: searchParams({ account: "nobody@example.com" }),
      }),
    );

    expect(
      screen.getByText(
        "No account has verified that email address or mobile number.",
      ),
    ).toBeInTheDocument();
  });

  it("reports a lookup that is neither an email nor a mobile number", async () => {
    vi.clearAllMocks();
    ready();

    render(
      await AdminSubscriptionsPage({
        searchParams: searchParams({ account: "priya" }),
      }),
    );

    // Nothing is queried, so a malformed lookup cannot probe the database.
    expect(findAccountByVerifiedContact).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Enter a valid email address or Indian mobile number.",
      ),
    ).toBeInTheDocument();
  });
});
