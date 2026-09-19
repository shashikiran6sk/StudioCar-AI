import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { ProfileDetailsCard } from "../../../../apps/web/src/features/profile/profile-details-card";
import { createTestRouter } from "./create-test-router";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));

describe("ProfileDetailsCard", () => {
  it("renders editable identity details without inventing missing contacts", () => {
    vi.mocked(useRouter).mockReturnValue(createTestRouter());

    render(
      <ProfileDetailsCard
        user={{
          id: "user-1",
          displayName: "Priya Sharma",
          primaryEmail: "priya@example.com",
          primaryPhone: null,
        }}
      />,
    );

    expect(screen.getByLabelText(/Display name/)).toHaveValue("Priya Sharma");
    expect(screen.getByText("priya@example.com")).toBeInTheDocument();
    expect(screen.getByText("Not connected")).toBeInTheDocument();
  });
});
