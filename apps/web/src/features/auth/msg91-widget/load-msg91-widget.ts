import {
  MSG91_WIDGET_LOAD_ERROR,
  MSG91_WIDGET_SCRIPT_ID,
  MSG91_WIDGET_SCRIPT_SRC,
  MSG91_WIDGET_STARTUP_ERROR,
} from "./msg91-widget.constants";
import type { Msg91WidgetCredentials } from "./msg91-widget.types";
import { waitForWidget } from "./wait-for-widget";

let loading: Promise<void> | null = null;

function methodsExposed(): boolean {
  return (
    typeof window.sendOtp === "function" &&
    typeof window.retryOtp === "function" &&
    typeof window.verifyOtp === "function"
  );
}

export function whenMsg91WidgetExposed(): Promise<void> {
  return waitForWidget(methodsExposed).catch(() => {
    throw new Error(MSG91_WIDGET_STARTUP_ERROR);
  });
}

/**
 * Loads the provider script once per page and initialises it with the
 * browser-safe widget credentials. `exposeMethods` is what lets the
 * application drive send, resend and verify instead of rendering the
 * provider's own interface.
 */
export function loadMsg91Widget(
  credentials: Msg91WidgetCredentials,
): Promise<void> {
  loading ??= new Promise<void>((resolve, reject) => {
    const fail = (error: unknown) => {
      loading = null;
      reject(
        error instanceof Error ? error : new Error(MSG91_WIDGET_LOAD_ERROR),
      );
    };

    const initialise = () => {
      if (typeof window.initSendOTP !== "function") {
        fail(new Error(MSG91_WIDGET_LOAD_ERROR));
        return;
      }
      window.initSendOTP({
        widgetId: credentials.widgetId,
        tokenAuth: credentials.tokenAuth,
        exposeMethods: true,
        ...(credentials.captchaRenderId === undefined
          ? {}
          : { captchaRenderId: credentials.captchaRenderId }),
        success: () => undefined,
        failure: () => undefined,
      });
      whenMsg91WidgetExposed().then(resolve, fail);
    };

    if (document.getElementById(MSG91_WIDGET_SCRIPT_ID)) {
      waitForWidget(() => typeof window.initSendOTP === "function").then(
        initialise,
        () => {
          fail(new Error(MSG91_WIDGET_LOAD_ERROR));
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = MSG91_WIDGET_SCRIPT_ID;
    script.src = MSG91_WIDGET_SCRIPT_SRC;
    script.async = true;
    script.onload = initialise;
    script.onerror = () => {
      script.remove();
      fail(new Error(MSG91_WIDGET_LOAD_ERROR));
    };
    document.head.append(script);
  });

  return loading;
}

export function resetMsg91Widget(): void {
  loading = null;
}
