import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PhoneSignInForm } from "../../../../apps/web/src/features/auth/phone-sign-in-form";

const CHALLENGE_ID = "4f9d4891-157f-49ed-aa5a-c026abc0a768";
const WIDGET_PATH = "/api/auth/phone/widget";
const START_PATH = "/api/auth/phone/start";
const VERIFY_PATH = "/api/auth/phone/verify";
const CREATE_PATH = "/api/auth/phone/create-account";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const developmentWidget = {
  enabled: true,
  driver: "fake",
  widgetId: null,
  tokenAuth: null,
  devCode: "1234",
  reason: null,
};

const disabledWidget = {
  enabled: false,
  driver: "msg91",
  widgetId: null,
  tokenAuth: null,
  devCode: null,
  reason: "Set MSG91_WIDGET_ID, MSG91_WIDGET_TOKEN, and MSG91_AUTH_KEY to verify phone numbers.",
};

/**
 * Routes by path so each test states only the responses it cares about.
 */
function stubFetch(
  routes: Partial<Record<string, () => Response>>,
): ReturnType<typeof vi.fn<typeof fetch>> {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const path = String(input);
    const route = routes[path];
    if (!route) throw new Error(`Unexpected request to ${path}`);
    return route();
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function renderWithWidget(widget: unknown) {
  const fetchMock = stubFetch({
    [WIDGET_PATH]: () => json(widget),
    [START_PATH]: () =>
      json(
        {
          status: "challenge_sent",
          challengeId: CHALLENGE_ID,
          expiresAt: "2026-09-19T12:10:00.000Z",
        },
        201,
      ),
    [VERIFY_PATH]: () =>
      json({
        status: "authenticated",
        user: {
          id: "user-1",
          displayName: null,
          primaryEmail: null,
          primaryPhone: "+919876543210",
        },
      }),
  });
  render(<PhoneSignInForm returnTo="/dashboard" />);
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(WIDGET_PATH, expect.anything());
  });
  return fetchMock;
}

describe("PhoneSignInForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("moves a newly verified phone to exactly two account choices", async () => {
    stubFetch({
      [WIDGET_PATH]: () => json(developmentWidget),
      [START_PATH]: () => json({
        status: "challenge_sent",
        challengeId: CHALLENGE_ID,
        expiresAt: "2026-09-24T12:10:00.000Z",
      }, 201),
      [VERIFY_PATH]: () => json({ status: "account_setup_required" }),
    });
    render(<PhoneSignInForm returnTo="/dashboard" />);
    fireEvent.change(await screen.findByRole("textbox", { name: /Phone number/ }), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue with phone" }));
    const code = await screen.findByRole("textbox", { name: /Verification code/ });
    fireEvent.change(code, { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));

    expect(await screen.findByRole("link", { name: "Link with Google" })).toHaveAttribute(
      "href",
      "/api/auth/google/start?intent=link_verified_phone&returnTo=%2Fdashboard",
    );
    expect(screen.getByRole("button", { name: "Create new account" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Continue with Google" })).toBeNull();
  });

  it("creates an account with a name only, never a browser-claimed phone", async () => {
    const fetchMock = stubFetch({
      [WIDGET_PATH]: () => json(developmentWidget),
      [CREATE_PATH]: () => json({
        status: "authenticated",
        user: {
          id: "user-1",
          displayName: "Shashi Kiran",
          primaryEmail: null,
          primaryPhone: "+919876543210",
        },
      }),
    });
    render(
      <PhoneSignInForm
        initialVerifiedPhone="+919876543210"
        returnTo="/dashboard"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create new account" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Shashi Kiran" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(CREATE_PATH, expect.anything());
    });
    const createCall = fetchMock.mock.calls.find(([path]) => String(path) === CREATE_PATH);
    expect(JSON.parse(String(createCall?.[1]?.body))).toEqual({
      displayName: "Shashi Kiran",
    });
  });

  it("rejects an invalid account name before submitting", async () => {
    const fetchMock = stubFetch({ [WIDGET_PATH]: () => json(developmentWidget) });
    render(
      <PhoneSignInForm initialVerifiedPhone="+919876543210" returnTo="/dashboard" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create new account" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "A" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Display name must contain at least 2 characters.")).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalledWith(CREATE_PATH, expect.anything());
  });

  it("requires phone verification again after an account-creation race", async () => {
    stubFetch({
      [WIDGET_PATH]: () => json(developmentWidget),
      [CREATE_PATH]: () => json({
        error: {
          code: "CONFLICT",
          message: "This phone number was linked to an account. Sign in with the phone number instead.",
          requestId: "request-1",
        },
      }, 409),
    });
    render(
      <PhoneSignInForm initialVerifiedPhone="+919876543210" returnTo="/dashboard" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create new account" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Shashi Kiran" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("textbox", { name: /Phone number/ })).toBeVisible();
    expect(screen.getByText(/phone number was linked to an account/)).toBeVisible();
  });

  it("returns an OAuth cancellation to the account choices", async () => {
    stubFetch({ [WIDGET_PATH]: () => json(developmentWidget) });
    render(
      <PhoneSignInForm
        initialVerifiedPhone="+919876543210"
        phoneSetupError="cancelled"
        returnTo="/dashboard"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Google linking was cancelled");
    expect(screen.getByRole("button", { name: "Create new account" })).toBeVisible();
  });

  it("validates the phone number before reserving a challenge", async () => {
    const fetchMock = await renderWithWidget(developmentWidget);

    fireEvent.change(screen.getByRole("textbox", { name: /Phone number/ }), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue with phone" }));

    expect(
      await screen.findByText("Enter a valid Indian mobile number."),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(START_PATH, expect.anything());
  });

  it("normalizes a phone number and advances to OTP verification", async () => {
    const fetchMock = await renderWithWidget(developmentWidget);

    fireEvent.change(screen.getByRole("textbox", { name: /Phone number/ }), {
      target: { value: "98765 43210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue with phone" }));

    expect(
      await screen.findByRole("textbox", { name: /Verification code/ }),
    ).toHaveFocus();
    expect(screen.getByText("+91 ******3210")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      START_PATH,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ phoneNumber: "+919876543210" }),
      }),
    );
  });

  it("focuses the verification code in the same update that reveals it", async () => {
    await renderWithWidget(developmentWidget);

    /**
     * A mutation observer runs the moment the code field is inserted, before
     * any work React defers to a later task. Checking focus there proves focus
     * moves with the field itself, not at some later point a slower machine
     * might not have reached yet.
     */
    let focusedWhenRevealed: Element | null | undefined;
    const observer = new MutationObserver(() => {
      if (focusedWhenRevealed !== undefined) return;
      const code = screen.queryByRole("textbox", { name: /Verification code/ });
      if (code) focusedWhenRevealed = document.activeElement;
    });
    observer.observe(document.body, { childList: true, subtree: true });

    fireEvent.change(screen.getByRole("textbox", { name: /Phone number/ }), {
      target: { value: "98765 43210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue with phone" }));
    const code = await screen.findByRole("textbox", {
      name: /Verification code/,
    });
    observer.disconnect();

    expect(focusedWhenRevealed).toBe(code);
  });

  it("shows a safe API error and preserves the entered number", async () => {
    stubFetch({
      [WIDGET_PATH]: () => json(developmentWidget),
      [START_PATH]: () =>
        json(
          {
            error: {
              code: "RATE_LIMITED",
              message: "Please wait before requesting another code.",
              requestId: "request-1",
            },
          },
          429,
        ),
    });
    render(<PhoneSignInForm returnTo="/dashboard" />);

    const phone = await screen.findByRole("textbox", { name: /Phone number/ });
    fireEvent.change(phone, { target: { value: "9876543210" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue with phone" }));

    await waitFor(() => {
      expect(
        screen.getByText("Please wait before requesting another code."),
      ).toBeInTheDocument();
    });
    expect(phone).toHaveValue("9876543210");
  });

  it("submits an access token rather than the code the person typed", async () => {
    const fetchMock = await renderWithWidget(developmentWidget);

    fireEvent.change(screen.getByRole("textbox", { name: /Phone number/ }), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue with phone" }));

    const code = await screen.findByRole("textbox", {
      name: /Verification code/,
    });
    fireEvent.change(code, { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(VERIFY_PATH, expect.anything());
    });
    const verifyCall = fetchMock.mock.calls.find(
      ([path]) => String(path) === VERIFY_PATH,
    );
    const body: unknown = JSON.parse(String(verifyCall?.[1]?.body));
    expect(body).toEqual({
      challengeId: CHALLENGE_ID,
      phoneNumber: "+919876543210",
      accessToken: `dev-otp:919876543210:1234:${CHALLENGE_ID}`,
    });
  });

  it("explains an unconfigured widget instead of offering a dead form", async () => {
    stubFetch({ [WIDGET_PATH]: () => json(disabledWidget) });
    render(<PhoneSignInForm returnTo="/dashboard" />);

    expect(await screen.findByRole("status")).toHaveTextContent(
      /MSG91_WIDGET_ID/,
    );
    expect(
      screen.queryByRole("button", { name: "Continue with phone" }),
    ).not.toBeInTheDocument();
  });

  it("offers a resend, after a pause, that reserves a fresh rate-limited challenge", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = await renderWithWidget(developmentWidget);

    fireEvent.change(screen.getByRole("textbox", { name: /Phone number/ }), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue with phone" }));
    await screen.findByRole("textbox", { name: /Verification code/ });

    expect(
      screen.getByRole("button", { name: "Resend code in 30s" }),
    ).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));

    expect(
      await screen.findByText("A new verification code has been sent."),
    ).toBeVisible();
    const startCalls = fetchMock.mock.calls.filter(
      ([path]) => String(path) === START_PATH,
    );
    expect(startCalls).toHaveLength(2);
    vi.useRealTimers();
  });

  it("rejects a wrong development code as incorrect and clears it", async () => {
    stubFetch({
      [WIDGET_PATH]: () => json(developmentWidget),
      [START_PATH]: () =>
        json(
          {
            status: "challenge_sent",
            challengeId: CHALLENGE_ID,
            expiresAt: "2026-09-19T12:10:00.000Z",
          },
          201,
        ),
      [VERIFY_PATH]: () =>
        json(
          {
            error: {
              code: "BAD_REQUEST",
              message:
                "The verification code you entered is incorrect. Please try again.",
              requestId: "request-1",
            },
          },
          400,
        ),
    });
    render(<PhoneSignInForm returnTo="/dashboard" />);
    fireEvent.change(await screen.findByRole("textbox", { name: /Phone number/ }), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue with phone" }));
    const code = await screen.findByRole("textbox", { name: /Verification code/ });

    fireEvent.change(code, { target: { value: "9999" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The verification code you entered is incorrect. Please try again.",
    );
    expect(code).toHaveValue("");
    expect(code).toHaveFocus();
  });
});
