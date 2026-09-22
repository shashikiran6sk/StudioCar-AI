import {
  MSG91_WIDGET_CALL_TIMEOUT_MS,
  MSG91_WIDGET_UNAVAILABLE_ERROR,
} from "./msg91-widget.constants";
import type { Msg91WidgetMethod } from "./msg91-widget.types";
import { whenMsg91WidgetExposed } from "./load-msg91-widget";

/**
 * The widget answers through callbacks that may never fire when a domain is
 * not allow-listed, so every call is bounded and settles exactly once.
 */
export function callMsg91Method<T>(
  method: Msg91WidgetMethod,
  run: (
    resolve: (value: T) => void,
    reject: (error: unknown) => void,
  ) => void,
  timeoutMs: number = MSG91_WIDGET_CALL_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const settle = <A>(act: (value: A) => void) => (value: A) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      act(value);
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(MSG91_WIDGET_UNAVAILABLE_ERROR));
    }, timeoutMs);

    const succeed = settle(resolve);
    const refuse = settle<unknown>((error) => {
      reject(
        error instanceof Error
          ? error
          : new Error(MSG91_WIDGET_UNAVAILABLE_ERROR),
      );
    });

    whenMsg91WidgetExposed().then(() => {
      if (typeof window[method] !== "function") {
        refuse(new Error(MSG91_WIDGET_UNAVAILABLE_ERROR));
        return;
      }
      try {
        run(succeed, refuse);
      } catch (error) {
        refuse(error);
      }
    }, refuse);
  });
}
