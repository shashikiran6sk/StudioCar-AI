import { Msg91WidgetDataSchema } from "@studiocar/contracts";

import {
  MSG91_CUSTOM_WIDGET_TYPE,
  MSG91_RETRY_PROCESS_VIA,
  MSG91_SMS_CHANNEL,
} from "./msg91-widget.constants";
import type { Msg91WidgetSettings } from "./msg91-widget.types";

const UNREPORTED_SETTINGS: Msg91WidgetSettings = {
  otpLength: null,
  resendDelaySeconds: null,
  retryChannel: null,
  canRetry: true,
};

function readWidgetData(): unknown {
  try {
    return typeof window.getWidgetData === "function"
      ? window.getWidgetData()
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Reads the code length, resend delay and resend channel from the widget's
 * own dashboard configuration, so none of them is duplicated in StudioCar.
 *
 * A Default widget resends on its configured channel when given `null`. A
 * Custom widget requires an explicit channel; SMS is preferred because it is
 * the channel the first code went out on, otherwise the first configured
 * resend channel is used.
 */
export function readMsg91WidgetSettings(): Msg91WidgetSettings {
  const parsed = Msg91WidgetDataSchema.safeParse(readWidgetData());
  if (!parsed.success) return UNREPORTED_SETTINGS;

  const { otpLength, retryTime, widgetType, processes = [] } = parsed.data;
  const retryChannels = processes
    .filter(
      (process) =>
        String(process.processVia.value) === MSG91_RETRY_PROCESS_VIA,
    )
    .map((process) => String(process.channel.value));
  const custom = String(widgetType?.value) === MSG91_CUSTOM_WIDGET_TYPE;
  const customChannel = retryChannels.includes(MSG91_SMS_CHANNEL)
    ? MSG91_SMS_CHANNEL
    : (retryChannels[0] ?? null);

  return {
    otpLength: otpLength ?? null,
    resendDelaySeconds: retryTime ?? null,
    retryChannel: custom ? customChannel : null,
    canRetry: !custom || customChannel !== null,
  };
}
