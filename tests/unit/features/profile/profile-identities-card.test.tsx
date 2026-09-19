import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileIdentitiesCard } from "../../../../apps/web/src/features/profile/profile-identities-card";

describe("ProfileIdentitiesCard", () => {
  it("shows linked and unavailable authentication methods truthfully", () => {
    render(
      <ProfileIdentitiesCard
        identities={[
          {
            provider: "GOOGLE",
            email: "priya@example.com",
            phoneNumber: null,
            linkedAt: "2026-09-19T00:00:00.000Z",
            lastAuthenticatedAt: "2026-09-19T01:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("priya@example.com")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Not connected")).toBeInTheDocument();
  });
});
