import {
  LeonardoImageUrlSchema,
  type LeonardoResult,
} from "@studiocar/contracts";

import { LEONARDO_OUTPUT_CONTENT_TYPE } from "./leonardo-provider.constants";
import type { ProviderFailureCategory } from "./provider-failure.types";

export type LeonardoResultSelection =
  | { ok: true; url: string; width: number | null; height: number | null }
  | { ok: false; category: ProviderFailureCategory };

/**
 * The single result a Sync generation returns, checked before anything is
 * downloaded. A moderated result is reported as such even when it still
 * carries a URL, and so is an empty result list whose output Leonardo
 * counted as blocked. A missing, extra or malformed result is an invalid
 * response.
 */
export function selectLeonardoResult(
  results: readonly LeonardoResult[],
  blockedCount: number | null = null,
): LeonardoResultSelection {
  const [result] = results;
  if (results.length === 0 && blockedCount !== null && blockedCount > 0) {
    return { ok: false, category: "CONTENT_BLOCKED" };
  }
  if (results.length !== 1 || result === undefined) {
    return { ok: false, category: "INVALID_RESPONSE" };
  }
  if (result.nsfw === true || result.blocked === true) {
    return { ok: false, category: "CONTENT_BLOCKED" };
  }
  const url = LeonardoImageUrlSchema.safeParse(result.url);
  if (!url.success) return { ok: false, category: "INVALID_RESPONSE" };
  if (
    typeof result.contentType === "string" &&
    result.contentType.toLowerCase() !== LEONARDO_OUTPUT_CONTENT_TYPE
  ) {
    return { ok: false, category: "INVALID_OUTPUT" };
  }
  return {
    ok: true,
    url: url.data,
    width: result.width ?? null,
    height: result.height ?? null,
  };
}
