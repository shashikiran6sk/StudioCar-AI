import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, useActionState: () => [null, vi.fn(), false] };
});
vi.mock(
  "../../../../apps/web/src/server/admin/admin-management-actions",
  () => ({ revokeAdministratorAction: vi.fn() }),
);

const { AdministratorList } = await import(
  "../../../../apps/web/src/features/admin/administrator-list"
);

const administrators = [
  {
    userId: "user-1",
    displayName: "Initial Admin",
    email: "initial@example.com",
    source: "BOOTSTRAP",
    grantedAt: "2026-09-20T10:00:00.000Z",
    grantedByName: null,
  },
  {
    userId: "user-2",
    displayName: "Second Admin",
    email: "second@example.com",
    source: "ADMIN_GRANT",
    grantedAt: "2026-09-21T10:00:00.000Z",
    grantedByName: "Initial Admin",
  },
];

describe("AdministratorList", () => {
  it("shows who each administrator is and where their access came from", () => {
    render(
      <AdministratorList
        administrators={administrators}
        currentUserId="user-1"
        onlyAdministrator={false}
      />,
    );

    expect(screen.getByText("Initial Admin")).toBeInTheDocument();
    expect(screen.getByText(/Initial administrator/)).toBeInTheDocument();
    expect(screen.getByText(/Granted by Initial Admin/)).toBeInTheDocument();
  });

  it("marks the signed-in administrator", () => {
    render(
      <AdministratorList
        administrators={administrators}
        currentUserId="user-1"
        onlyAdministrator={false}
      />,
    );

    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("disables revocation when only one administrator remains", () => {
    render(
      <AdministratorList
        administrators={[administrators[0]!]}
        currentUserId="user-1"
        onlyAdministrator
      />,
    );

    expect(screen.getByRole("button", { name: "Revoke" })).toBeDisabled();
    expect(screen.getByText(/cannot be revoked/)).toBeInTheDocument();
  });

  it("allows revocation when another administrator remains", () => {
    render(
      <AdministratorList
        administrators={administrators}
        currentUserId="user-1"
        onlyAdministrator={false}
      />,
    );

    for (const button of screen.getAllByRole("button", { name: "Revoke" })) {
      expect(button).toBeEnabled();
    }
  });

  it("names an account with no display name or email truthfully", () => {
    render(
      <AdministratorList
        administrators={[
          { ...administrators[0]!, displayName: null, email: null },
        ]}
        currentUserId="user-9"
        onlyAdministrator
      />,
    );

    expect(screen.getByText("Unnamed account")).toBeInTheDocument();
    expect(screen.getByText("No verified email")).toBeInTheDocument();
  });
});
