import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InventoryCardAction } from "../../../../apps/web/src/features/inventory/inventory-card-action";

const ITEM = {
  brand: null,
  completedImageCount: 4,
  createdAt: "2026-09-18T10:00:00.000Z",
  failedImageCount: 0,
  hasCompletedOutput: true,
  id: "4bb7fa89-c907-4458-9786-8aafc2235728",
  imageCount: 4,
  model: null,
  name: "2022 BMW X1",
  previewUrl: null,
  status: "COMPLETED",
  stockId: null,
  year: null,
} satisfies Parameters<typeof InventoryCardAction>[0]["item"];

describe("InventoryCardAction", () => {
  it("opens a completed vehicle's portfolio", () => {
    render(<InventoryCardAction item={ITEM} />);

    expect(screen.getByRole("link", { name: /Open portfolio/ })).toHaveAttribute(
      "href",
      `/inventory/${ITEM.id}`,
    );
  });

  it("offers nothing for a first batch still processing", () => {
    const { container } = render(
      <InventoryCardAction
        item={{ ...ITEM, hasCompletedOutput: false, status: "PROCESSING" }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("leads a vehicle that needs attention to its failures", () => {
    render(<InventoryCardAction item={{ ...ITEM, status: "FAILED" }} />);

    expect(screen.getByRole("link", { name: /Review issues/ })).toHaveAttribute(
      "href",
      `/inventory/${ITEM.id}#attention`,
    );
  });

  it("prefers the selection link while choosing a vehicle", () => {
    render(<InventoryCardAction item={ITEM} selectHref="/inventory?vehicle=x" />);

    expect(screen.getByRole("link", { name: /Create images/ })).toHaveAttribute(
      "href",
      "/inventory?vehicle=x",
    );
  });
});
