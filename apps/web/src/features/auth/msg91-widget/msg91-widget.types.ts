export type Msg91WidgetCallback = (data: unknown) => void;

export interface Msg91WidgetConfiguration {
  widgetId: string;
  tokenAuth: string;
  exposeMethods: true;
  captchaRenderId?: string;
  success: Msg91WidgetCallback;
  failure: Msg91WidgetCallback;
}

export type Msg91WidgetMethod = "sendOtp" | "retryOtp" | "verifyOtp";

declare global {
  interface Window {
    initSendOTP?: (configuration: Msg91WidgetConfiguration) => void;
    sendOtp?: (
      identifier: string,
      success?: Msg91WidgetCallback,
      failure?: Msg91WidgetCallback,
    ) => void;
    retryOtp?: (
      channel: string | null,
      success?: Msg91WidgetCallback,
      failure?: Msg91WidgetCallback,
      requestId?: string,
    ) => void;
    verifyOtp?: (
      otp: string,
      success?: Msg91WidgetCallback,
      failure?: Msg91WidgetCallback,
      requestId?: string,
    ) => void;
    getWidgetData?: () => unknown;
  }
}

export interface Msg91WidgetCredentials {
  widgetId: string;
  tokenAuth: string;
  captchaRenderId?: string;
}

/**
 * Dashboard settings read from the running widget. `null` means the widget
 * did not report the value, so the caller must not invent one.
 */
export interface Msg91WidgetSettings {
  otpLength: number | null;
  resendDelaySeconds: number | null;
  /** Channel for `retryOtp`; `null` selects the widget's default channel. */
  retryChannel: string | null;
  /** False for a Custom widget with no resend process configured. */
  canRetry: boolean;
}
