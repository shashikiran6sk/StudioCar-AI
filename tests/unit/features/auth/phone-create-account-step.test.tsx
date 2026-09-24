import { fireEvent, render, screen } from "@testing-library/react";
import type { FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import { PhoneCreateAccountStep } from "../../../../apps/web/src/features/auth/phone-create-account-step";

describe("PhoneCreateAccountStep", () => {
  it("keeps the verified phone read-only and requests only a name", () => {
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
    });
    const onDisplayNameChange = vi.fn();
    const { rerender } = render(
      <PhoneCreateAccountStep
        displayName=""
        onBack={vi.fn()}
        onDisplayNameChange={onDisplayNameChange}
        onSubmit={onSubmit}
        pending={false}
        phoneNumber="+919876543210"
      />,
    );
    expect(screen.getByText("+919876543210")).toBeVisible();
    expect(screen.queryByRole("textbox", { name: /Phone/ })).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Shashi Kiran" },
    });
    expect(onDisplayNameChange).toHaveBeenCalledWith("Shashi Kiran");
    rerender(
      <PhoneCreateAccountStep
        displayName="Shashi Kiran"
        onBack={vi.fn()}
        onDisplayNameChange={onDisplayNameChange}
        onSubmit={onSubmit}
        pending={false}
        phoneNumber="+919876543210"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
