import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InventoryEmptyState } from "../../../../apps/web/src/features/inventory/inventory-empty-state";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("InventoryEmptyState", () => {
  it("uses the fixed empty inventory copy and upload recovery", () => {
    render(<InventoryEmptyState filtered={false} />);

    expect(screen.getByRole("heading", { name: "Your inventory is empty" }))
      .toBeVisible();
    expect(screen.getByRole("button", { name: "+ Upload Vehicle" }))
      .toBeVisible();
  });

  it("does not suggest a new upload for a filtered no-results state", () => {
    render(<InventoryEmptyState filtered />);

    expect(screen.getByRole("heading", { name: "No vehicles match these filters" }))
      .toBeVisible();
    expect(screen.queryByRole("button", { name: "+ Upload Vehicle" }))
      .not.toBeInTheDocument();
  });

  it("explains an empty choice of vehicles without offering an upload", () => {
    render(<InventoryEmptyState choosing filtered={false} />);

    expect(screen.getByRole("heading", { name: "No vehicles are ready yet" }))
      .toBeVisible();
    expect(screen.queryByRole("button", { name: "+ Upload Vehicle" }))
      .not.toBeInTheDocument();
  });
});
