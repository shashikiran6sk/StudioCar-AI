import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Sheet, SheetContent, SheetTrigger } from "../../../packages/ui/src/sheet";

function renderSheet() {
  render(
    <Sheet>
      <SheetTrigger>Open menu</SheetTrigger>
      <SheetContent
        closeLabel="Close menu"
        description="Move between pages"
        header={<span>Brand</span>}
        title="Site navigation"
      >
        <a href="/inventory">Inventory</a>
      </SheetContent>
    </Sheet>,
  );
}

afterEach(cleanup);

describe("Sheet", () => {
  it("opens as a named modal dialog with its header and content", () => {
    renderSheet();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const sheet = screen.getByRole("dialog", { name: "Site navigation" });
    expect(sheet).toHaveAccessibleDescription("Move between pages");
    expect(sheet).toHaveTextContent("Brand");
    expect(screen.getByRole("link", { name: "Inventory" })).toBeInTheDocument();
  });

  it("closes from its close control", () => {
    renderSheet();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    renderSheet();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
