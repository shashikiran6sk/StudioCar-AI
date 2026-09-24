import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PhoneAccountChoices } from "../../../../apps/web/src/features/auth/phone-account-choices";

describe("PhoneAccountChoices", () => {
  it("shows exactly the Google-link and account-creation decisions", () => {
    const onCreate = vi.fn();
    render(
      <PhoneAccountChoices
        onCreate={onCreate}
        phoneNumber="+919876543210"
        returnTo="/dashboard"
      />,
    );
    expect(screen.getByText(/Phone verified/)).toBeVisible();
    expect(screen.getByRole("link", { name: /Link with Google/ })).toHaveAttribute(
      "href",
      "/api/auth/google/start?intent=link_verified_phone&returnTo=%2Fdashboard",
    );
    fireEvent.click(screen.getByRole("button", { name: "Create new account" }));
    expect(onCreate).toHaveBeenCalledOnce();
    expect(screen.queryByRole("link", { name: "Continue with Google" })).toBeNull();
  });
});
