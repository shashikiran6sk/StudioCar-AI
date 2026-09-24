import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConnectPhoneForm } from "../../../../apps/web/src/features/profile/connect-phone-form";

const WIDGET_PATH = "/api/auth/phone/widget";
const START_PATH = "/api/auth/phone/start";
const LINK_PATH = "/api/profile/identities/phone";
const CHALLENGE_ID = "4f9d4891-157f-49ed-aa5a-c026abc0a768";

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

function stubFetch(overrides: Partial<Record<string, () => Response>> = {}) {
  const routes: Record<string, () => Response> = {
    [WIDGET_PATH]: () => json(developmentWidget),
    [START_PATH]: () =>
      json(
        {
          status: "challenge_sent",
          challengeId: CHALLENGE_ID,
          expiresAt: "2026-09-22T12:10:00.000Z",
        },
        201,
      ),
    [LINK_PATH]: () => json({ status: "linked", provider: "PHONE" }),
    ...overrides,
  };
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const route = routes[String(input)];
    if (!route) throw new Error(`Unexpected request to ${String(input)}`);
    return route();
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function sendCode(fetchMock: ReturnType<typeof stubFetch>) {
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(WIDGET_PATH, expect.anything());
  });
  fireEvent.change(screen.getByRole("textbox", { name: /Phone number/ }), {
    target: { value: "9876543210" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Send verification code" }),
  );
  return screen.findByRole("textbox", { name: /Verification code/ });
}

describe("ConnectPhoneForm", () => {
  it("proves the number and connects it to the signed-in account", async () => {
    const onConnected = vi.fn();
    const fetchMock = stubFetch();
    render(<ConnectPhoneForm onConnected={onConnected} />);

    const code = await sendCode(fetchMock);
    fireEvent.change(code, { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Connect phone" }));

    await waitFor(() => {
      expect(onConnected).toHaveBeenCalled();
    });
    const call = fetchMock.mock.calls.find(
      ([path]) => String(path) === LINK_PATH,
    );
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({
      challengeId: CHALLENGE_ID,
      phoneNumber: "+919876543210",
      accessToken: `dev-otp:919876543210:1234:${CHALLENGE_ID}`,
    });
  });

  it("shows a safe refusal when the number belongs to another account", async () => {
    const onConnected = vi.fn();
    const fetchMock = stubFetch({
      [LINK_PATH]: () =>
        json(
          {
            error: {
              code: "CONFLICT",
              message:
                "That sign-in method already belongs to another StudioCar AI account.",
              requestId: "request-1",
            },
          },
          409,
        ),
    });
    render(<ConnectPhoneForm onConnected={onConnected} />);

    const code = await sendCode(fetchMock);
    fireEvent.change(code, { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Connect phone" }));

    expect(
      await screen.findByText(/already belongs to another StudioCar AI account/),
    ).toBeInTheDocument();
    expect(onConnected).not.toHaveBeenCalled();
  });

  it("validates the number before reserving a challenge", async () => {
    const fetchMock = stubFetch();
    render(<ConnectPhoneForm onConnected={vi.fn()} />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(WIDGET_PATH, expect.anything());
    });

    fireEvent.change(screen.getByRole("textbox", { name: /Phone number/ }), {
      target: { value: "123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Send verification code" }),
    );

    expect(
      await screen.findByText("Enter a valid Indian mobile number."),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(START_PATH, expect.anything());
  });
});
