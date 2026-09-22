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
  }
}

export interface Msg91WidgetCredentials {
  widgetId: string;
  tokenAuth: string;
  captchaRenderId?: string;
}
