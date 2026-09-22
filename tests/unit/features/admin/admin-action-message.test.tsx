import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminActionMessage } from "../../../../apps/web/src/features/admin/admin-action-message";

describe("AdminActionMessage", () => {
  it("announces a success politely", () => {
    render(
      <AdminActionMessage message={{ kind: "success", message: "Granted." }} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Granted.");
  });

  it("announces a refusal assertively", () => {
    render(
      <AdminActionMessage
        message={{ kind: "error", message: "Only administrator." }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Only administrator.");
  });

  it("renders nothing when there is nothing to say", () => {
    const { container } = render(<AdminActionMessage message={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
