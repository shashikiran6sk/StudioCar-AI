import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  PhoneOtpStep,
  type PhoneOtpStepProps,
} from "../../../../apps/web/src/features/auth/phone-otp-step";

function renderStep(overrides: Partial<PhoneOtpStepProps> = {}) {
  const props: PhoneOtpStepProps = {
    captchaId: "captcha",
    code: "",
    codeLength: 6,
    canVerify: false,
    developmentMode: false,
    maskedPhoneNumber: "+91 ******3210",
    onChangeNumber: vi.fn(),
    onCodeChange: vi.fn(),
    onResend: vi.fn(),
    onSubmit: vi.fn((event) => event.preventDefault()),
    pending: false,
    resendCountdownSeconds: 0,
    resending: false,
    ...overrides,
  };
  render(<PhoneOtpStep {...props} />);
  return props;
}

describe("PhoneOtpStep", () => {
  it("shows where the code went without the full number", () => {
    renderStep();

    expect(
      screen.getByRole("heading", { name: "Enter verification code" }),
    ).toBeVisible();
    expect(screen.getByText("+91 ******3210")).toBeVisible();
    expect(screen.getByText("Didn't receive the code?")).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: /Verification code/ }),
    ).toHaveAttribute("maxLength", "6");
  });

  it("disables Verify until the code is complete", () => {
    renderStep();
    expect(
      screen.getByRole("button", { name: "Verify and continue" }),
    ).toBeDisabled();
  });

  it("announces an error and ties it to the code field", () => {
    renderStep({ error: "The verification code you entered is incorrect. Please try again." });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("incorrect");
    const input = screen.getByRole("textbox", { name: /Verification code/ });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", alert.id);
  });

  it("announces a resend confirmation politely", () => {
    renderStep({ notice: "A new verification code has been sent." });

    expect(screen.getByRole("status")).toHaveTextContent(
      "A new verification code has been sent.",
    );
  });

  it("shows the resend countdown and disables resend while it runs", () => {
    renderStep({ resendCountdownSeconds: 41 });

    expect(screen.getByRole("button", { name: "Resend code in 41s" })).toBeDisabled();
  });

  it("shows pending labels and locks every action", () => {
    renderStep({ pending: true, canVerify: true });

    expect(screen.getByRole("button", { name: "Verifying…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Resend code" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Use a different number" }),
    ).toBeDisabled();
  });

  it("forwards typing, resend and change-number", () => {
    const props = renderStep({ canVerify: true, code: "123456" });

    fireEvent.change(screen.getByRole("textbox", { name: /Verification code/ }), {
      target: { value: "12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    fireEvent.click(screen.getByRole("button", { name: "Use a different number" }));
    fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));

    expect(props.onCodeChange).toHaveBeenCalledWith("12");
    expect(props.onResend).toHaveBeenCalled();
    expect(props.onChangeNumber).toHaveBeenCalled();
    expect(props.onSubmit).toHaveBeenCalled();
  });
});
