import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import InventoryLoading from "../../../../../apps/web/src/app/(app)/inventory/loading";

describe("InventoryLoading", () => {
  it("preserves the inventory grid geometry while data loads", () => {
    render(<InventoryLoading />);

    expect(screen.getByRole("status", { name: "Loading inventory" }))
      .toBeVisible();
    expect(screen.getAllByLabelText("Loading")).toHaveLength(10);
  });
});
