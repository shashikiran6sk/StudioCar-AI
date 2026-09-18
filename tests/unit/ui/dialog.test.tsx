import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Dialog, DialogContent, DialogTrigger } from "../../../packages/ui/src/dialog";

describe("Dialog", () => {
  it("opens with an accessible title and closes on Escape", () => {
    render(
      <Dialog>
        <DialogTrigger>Upload vehicle</DialogTrigger>
        <DialogContent description="Create a new vehicle batch" title="Vehicle details">
          Form content
        </DialogContent>
      </Dialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Upload vehicle" }));
    expect(screen.getByRole("dialog", { name: "Vehicle details" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Vehicle details" })).not.toBeInTheDocument();
  });
});

