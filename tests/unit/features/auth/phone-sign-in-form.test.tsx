import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PhoneSignInForm } from "../../../../apps/web/src/features/auth/phone-sign-in-form";

const CHALLENGE_ID = "4f9d4891-157f-49ed-aa5a-c026abc0a768";

describe("PhoneSignInForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("validates the phone number before making a request", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    render(<PhoneSignInForm returnTo="/dashboard" />);

    fireEvent.change(screen.getByRole("textbox", { name: /Phone number/ }), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue with phone" }));

    expect(
      await screen.findByText("Enter a valid Indian mobile number."),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes a phone number and advances to OTP verification", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          status: "challenge_sent",
          challengeId: CHALLENGE_ID,
          expiresAt: "2026-09-19T12:10:00.000Z",
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<PhoneSignInForm returnTo="/dashboard" />);

    fireEvent.change(screen.getByRole("textbox", { name: /Phone number/ }), {
      target: { value: "98765 43210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue with phone" }));

    expect(
      await screen.findByRole("textbox", { name: /Verification code/ }),
    ).toHaveFocus();
    expect(screen.getByText("+919876543210")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/phone/start",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ phoneNumber: "+919876543210" }),
      }),
    );
  });

  it("shows a safe API error and preserves the entered number", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "RATE_LIMITED",
            message: "Please wait before requesting another code.",
            requestId: "request-1",
          },
        }),
        { status: 429, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<PhoneSignInForm returnTo="/dashboard" />);

    const phone = screen.getByRole("textbox", { name: /Phone number/ });
    fireEvent.change(phone, { target: { value: "9876543210" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue with phone" }));

    await waitFor(() => {
      expect(
        screen.getByText("Please wait before requesting another code."),
      ).toBeInTheDocument();
    });
    expect(phone).toHaveValue("9876543210");
  });
});
