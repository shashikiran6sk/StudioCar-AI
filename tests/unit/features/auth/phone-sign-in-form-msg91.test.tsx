import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PhoneSignInForm } from "../../../../apps/web/src/features/auth/phone-sign-in-form";
import {
  MSG91_INVALID_OTP,
  MSG91_RETRY_WAIT,
  MSG91_SEND_SUCCESS,
  MSG91_TRANSPORT_FAILURE,
  MSG91_VERIFICATION_LIMIT,
} from "./msg91-widget/msg91-fixtures";

vi.mock("../../../../apps/web/src/features/auth/msg91-widget/load-msg91-widget", () => ({
  loadMsg91Widget: vi.fn(async () => undefined),
  whenMsg91WidgetExposed: vi.fn(async () => undefined),
  resetMsg91Widget: vi.fn(),
}));

const CHALLENGE_ID = "4f9d4891-157f-49ed-aa5a-c026abc0a768";
const SECOND_CHALLENGE_ID = "5a0e5902-268a-4afe-bb6b-d137bcd1b879";
const WIDGET_PATH = "/api/auth/phone/widget";
const START_PATH = "/api/auth/phone/start";
const VERIFY_PATH = "/api/auth/phone/verify";
const REQUEST_ID = MSG91_SEND_SUCCESS.message;
const INCORRECT =
  "The verification code you entered is incorrect. Please try again.";

const msg91Widget = {
  enabled: true,
  driver: "msg91",
  widgetId: "widget-id",
  tokenAuth: "widget-token",
  devCode: null,
  reason: null,
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function started(challengeId: string): Response {
  return json(
    {
      status: "challenge_sent",
      challengeId,
      expiresAt: "2026-09-25T12:15:00.000Z",
    },
    201,
  );
}

type VerifyCallback = (data: unknown) => void;

function stubWidget({ retryTime = 0 }: { retryTime?: number } = {}) {
  window.getWidgetData = () => ({
    widgetType: { value: "2" },
    otpLength: 6,
    retryTime,
    processes: [{ processVia: { value: "5" }, channel: { value: "11" } }],
  });
  window.sendOtp = vi.fn((_identifier, success) =>
    success?.(MSG91_SEND_SUCCESS),
  );
  window.retryOtp = vi.fn((_channel, success) =>
    success?.(MSG91_SEND_SUCCESS),
  );
  window.verifyOtp = vi.fn(
    (_code: string, success?: VerifyCallback) =>
      success?.({ type: "success", message: "signed.access.token" }),
  );
}

function stubFetch(verify: () => Response = () => json({ status: "account_setup_required" })) {
  let starts = 0;
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const path = String(input);
    if (path === WIDGET_PATH) return json(msg91Widget);
    if (path === START_PATH) {
      starts += 1;
      return started(starts === 1 ? CHALLENGE_ID : SECOND_CHALLENGE_ID);
    }
    if (path === VERIFY_PATH) return verify();
    throw new Error(`Unexpected request to ${path}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function callsTo(fetchMock: ReturnType<typeof stubFetch>, path: string) {
  return fetchMock.mock.calls.filter(([input]) => String(input) === path);
}

async function reachOtpStep(): Promise<HTMLElement> {
  render(<PhoneSignInForm returnTo="/dashboard" />);
  fireEvent.change(await screen.findByRole("textbox", { name: /Phone number/ }), {
    target: { value: "9876543210" },
  });
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Continue with phone" })).toBeEnabled();
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue with phone" }));
  return screen.findByRole("textbox", { name: /Verification code/ });
}

function enterCode(input: HTMLElement, code: string) {
  fireEvent.change(input, { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));
}

function refuseVerify(...failures: unknown[]) {
  const queue = [...failures];
  window.verifyOtp = vi.fn(
    (_code: string, _success?: VerifyCallback, failure?: VerifyCallback) =>
      failure?.(queue.shift()),
  );
}

beforeEach(() => {
  stubWidget();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  delete window.sendOtp;
  delete window.retryOtp;
  delete window.verifyOtp;
  delete window.getWidgetData;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PhoneSignInForm with the MSG91 widget", () => {
  it("verifies the code against the sent request and lets the server decide", async () => {
    const fetchMock = stubFetch();
    const code = await reachOtpStep();

    expect(screen.getByText("+91 ******3210")).toBeVisible();
    enterCode(code, "123456");

    expect(
      await screen.findByRole("button", { name: "Create new account" }),
    ).toBeVisible();
    expect(window.verifyOtp).toHaveBeenCalledWith(
      "123456",
      expect.any(Function),
      expect.any(Function),
      REQUEST_ID,
    );
    const body: unknown = JSON.parse(
      String(callsTo(fetchMock, VERIFY_PATH)[0]?.[1]?.body),
    );
    expect(body).toEqual({
      challengeId: CHALLENGE_ID,
      phoneNumber: "+919876543210",
      accessToken: "signed.access.token",
    });
  });

  it("shows an incorrect code as incorrect and stays on the code step", async () => {
    const fetchMock = stubFetch();
    refuseVerify(MSG91_INVALID_OTP);
    const code = await reachOtpStep();

    enterCode(code, "000000");

    expect(await screen.findByRole("alert")).toHaveTextContent(INCORRECT);
    expect(screen.queryByText(/not available/)).toBeNull();
    expect(code).toHaveValue("");
    expect(code).toHaveFocus();
    expect(screen.getByText("+91 ******3210")).toBeVisible();
    expect(callsTo(fetchMock, VERIFY_PATH)).toHaveLength(0);
  });

  it("locks verification after MSG91's attempt limit and resends a new request", async () => {
    const fetchMock = stubFetch();
    refuseVerify(
      MSG91_INVALID_OTP,
      MSG91_INVALID_OTP,
      MSG91_INVALID_OTP,
      MSG91_VERIFICATION_LIMIT,
    );
    const code = await reachOtpStep();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      enterCode(code, "000000");
      await screen.findByText(INCORRECT);
    }
    enterCode(code, "000000");

    expect(
      await screen.findByText(
        "Too many incorrect verification attempts. Please request a new code and try again.",
      ),
    ).toBeVisible();
    fireEvent.change(code, { target: { value: "123456" } });
    expect(
      screen.getByRole("button", { name: "Verify and continue" }),
    ).toBeDisabled();
    expect(callsTo(fetchMock, VERIFY_PATH)).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    expect(
      await screen.findByText("A new verification code has been sent."),
    ).toBeVisible();
    expect(window.sendOtp).toHaveBeenCalledTimes(2);
    expect(window.retryOtp).not.toHaveBeenCalled();
  });

  it("shows an expired code as expired and keeps resend available", async () => {
    stubFetch(() =>
      json(
        {
          error: {
            code: "BAD_REQUEST",
            message:
              "This verification code has expired. Request a new code to continue.",
            requestId: "request-1",
          },
        },
        400,
      ),
    );
    const code = await reachOtpStep();

    enterCode(code, "123456");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This verification code has expired. Request a new code to continue.",
    );
    expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled();
    expect(code).toHaveValue("");
  });

  it("resends through retryOtp for the same request and confirms it", async () => {
    const fetchMock = stubFetch();
    const code = await reachOtpStep();
    fireEvent.change(code, { target: { value: "12" } });

    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));

    expect(
      await screen.findByText("A new verification code has been sent."),
    ).toBeVisible();
    expect(window.retryOtp).toHaveBeenCalledWith(
      "11",
      expect.any(Function),
      expect.any(Function),
      REQUEST_ID,
    );
    expect(window.sendOtp).toHaveBeenCalledTimes(1);
    expect(code).toHaveValue("");
    expect(callsTo(fetchMock, START_PATH)).toHaveLength(2);
  });

  it("verifies against the challenge reserved by the latest resend", async () => {
    const fetchMock = stubFetch();
    const code = await reachOtpStep();
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await screen.findByText("A new verification code has been sent.");

    enterCode(code, "123456");

    await waitFor(() => {
      expect(callsTo(fetchMock, VERIFY_PATH)).toHaveLength(1);
    });
    expect(String(callsTo(fetchMock, VERIFY_PATH)[0]?.[1]?.body)).toContain(
      SECOND_CHALLENGE_ID,
    );
  });

  it("shows MSG91's resend throttle as a rate limit with its wait", async () => {
    stubFetch();
    window.retryOtp = vi.fn((_channel, _success, failure) =>
      failure?.(MSG91_RETRY_WAIT),
    );
    await reachOtpStep();

    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many OTP requests. Please wait before requesting another code.",
    );
    expect(
      screen.getByRole("button", { name: "Resend code in 41s" }),
    ).toBeDisabled();
    expect(window.sendOtp).toHaveBeenCalledTimes(1);
  });

  it("waits out the widget's own resend delay before offering a resend", async () => {
    stubWidget({ retryTime: 60 });
    stubFetch();
    await reachOtpStep();

    expect(
      screen.getByRole("button", { name: "Resend code in 60s" }),
    ).toBeDisabled();
  });

  it("describes a provider outage as an outage and keeps the code", async () => {
    stubFetch();
    refuseVerify(MSG91_TRANSPORT_FAILURE);
    const code = await reachOtpStep();

    enterCode(code, "123456");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't verify your code right now. Please try again.",
    );
    expect(code).toHaveValue("123456");
  });

  it("never sends a malformed code to MSG91", async () => {
    stubFetch();
    const code = await reachOtpStep();

    fireEvent.change(code, { target: { value: "12ab" } });
    expect(code).toHaveValue("12");
    expect(
      screen.getByRole("button", { name: "Verify and continue" }),
    ).toBeDisabled();

    const form = code.closest("form");
    if (!form) throw new Error("The code field is not in a form.");
    fireEvent.submit(form);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter the complete verification code using digits only.",
    );
    expect(window.verifyOtp).not.toHaveBeenCalled();
  });

  it("sends one verification however quickly Verify is pressed", async () => {
    stubFetch();
    let answer: VerifyCallback | undefined;
    window.verifyOtp = vi.fn((_code: string, success?: VerifyCallback) => {
      answer = success;
    });
    const code = await reachOtpStep();
    fireEvent.change(code, { target: { value: "123456" } });
    const verify = screen.getByRole("button", { name: "Verify and continue" });

    fireEvent.click(verify);
    fireEvent.click(verify);
    const form = code.closest("form");
    if (!form) throw new Error("The code field is not in a form.");
    fireEvent.submit(form);

    expect(
      await screen.findByRole("button", { name: "Verifying…" }),
    ).toBeDisabled();
    await waitFor(() => {
      expect(window.verifyOtp).toHaveBeenCalled();
    });
    fireEvent.submit(form);
    expect(window.verifyOtp).toHaveBeenCalledTimes(1);
    answer?.({ type: "success", message: "signed.access.token" });
    expect(
      await screen.findByRole("button", { name: "Create new account" }),
    ).toBeVisible();
  });
});
