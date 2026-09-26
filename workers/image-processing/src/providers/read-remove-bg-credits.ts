import { REMOVE_BG_CREDITS_HEADER } from "./remove-bg-telemetry.constants";

export function readRemoveBgCredits(headers: Headers): number | undefined {
  const value = headers.get(REMOVE_BG_CREDITS_HEADER)?.trim();
  if (!value || !/^\d+(?:\.\d+)?$/.test(value)) return;
  const credits = Number(value);
  return Number.isFinite(credits) && credits >= 0 ? credits : undefined;
}
