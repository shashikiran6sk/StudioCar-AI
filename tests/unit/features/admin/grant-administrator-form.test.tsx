import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, useActionState: () => [null, vi.fn(), false] };
});
vi.mock(
  "../../../../apps/web/src/server/admin/admin-management-actions",
  () => ({ grantAdministratorAction: vi.fn() }),
);

const { GrantAdministratorForm } = await import(
  "../../../../apps/web/src/features/admin/grant-administrator-form"
);

describe("GrantAdministratorForm", () => {
  it("asks for a Google email and explains what happens next", () => {
    render(<GrantAdministratorForm />);

    expect(screen.getByLabelText(/Google email/)).toBeRequired();
    expect(screen.getByText(/verified Google account/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Grant access" }),
    ).toBeInTheDocument();
  });
});
