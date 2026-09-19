import { REMOVE_BG_REQUEST_ID_HEADERS } from "./remove-bg-provider.constants";

export function readRemoveBgRequestId(headers: Headers): string | null {
  for (const header of REMOVE_BG_REQUEST_ID_HEADERS) {
    const value = headers.get(header)?.trim();
    if (value) return value.slice(0, 255);
  }
  return null;
}
