import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, useActionState: () => [null, vi.fn(), false] };
});
vi.mock(
  "../../../../apps/web/src/server/admin/admin-management-actions",
  () => ({ revokeInvitationAction: vi.fn() }),
);

const { AdministratorInviteList } = await import(
  "../../../../apps/web/src/features/admin/administrator-invite-list"
);

const invites = [
  {
    id: "invite-1",
    email: "invited@example.com",
    createdAt: "2026-09-22T10:00:00.000Z",
    expiresAt: "2026-09-29T10:00:00.000Z",
    invitedByName: "Initial Admin",
  },
];

describe("AdministratorInviteList", () => {
  it("lists a pending invitation with who sent it and when it expires", () => {
    render(<AdministratorInviteList invites={invites} />);

    expect(screen.getByText("invited@example.com")).toBeInTheDocument();
    expect(screen.getByText(/Invited by Initial Admin/)).toBeInTheDocument();
    expect(screen.getByText(/Expires/)).toBeInTheDocument();
  });

  it("explains that an invitation activates only on a verified sign-in", () => {
    render(<AdministratorInviteList invites={invites} />);

    expect(screen.getByText(/Google has verified/)).toBeInTheDocument();
  });

  it("says plainly when nothing is waiting", () => {
    render(<AdministratorInviteList invites={[]} />);

    expect(screen.getByText("No invitations are waiting.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel invitation" }),
    ).toBeNull();
  });
});
