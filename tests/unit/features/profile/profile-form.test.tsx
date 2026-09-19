import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProfileForm } from "../../../../apps/web/src/features/profile/profile-form";
import { createTestRouter } from "./create-test-router";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));

describe("ProfileForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("validates the display name before submitting", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(useRouter).mockReturnValue(createTestRouter());
    render(<ProfileForm initialDisplayName="Priya Sharma" />);

    fireEvent.change(screen.getByLabelText(/Display name/), {
      target: { value: "P" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    expect(
      await screen.findByText("Display name must contain at least 2 characters."),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("saves a normalized name and refreshes server-rendered account data", async () => {
    const refresh = vi.fn();
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          user: {
            id: "user-1",
            displayName: "Priya Anand",
            primaryEmail: "priya@example.com",
            primaryPhone: null,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(useRouter).mockReturnValue(createTestRouter(refresh));
    render(<ProfileForm initialDisplayName="Priya Sharma" />);

    fireEvent.change(screen.getByLabelText(/Display name/), {
      target: { value: "  Priya Anand  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Profile updated.",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profile",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ displayName: "Priya Anand" }),
      }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });
});
