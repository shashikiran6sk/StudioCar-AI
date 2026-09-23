const IMAGE_SINGULAR = "image";
const IMAGE_PLURAL = "images";
const NEEDS_SINGULAR = "needs";
const NEEDS_PLURAL = "need";

/** `2 of 20 images need attention` — the real failed-image count. */
export function formatAttentionCount(failed: number, total: number): string {
  return `${String(failed)} of ${String(total)} ${
    total === 1 ? IMAGE_SINGULAR : IMAGE_PLURAL
  } ${failed === 1 ? NEEDS_SINGULAR : NEEDS_PLURAL} attention`;
}
