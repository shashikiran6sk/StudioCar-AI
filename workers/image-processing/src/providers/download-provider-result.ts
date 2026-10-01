import { LEONARDO_DOWNLOAD_RETRY_DELAYS_MS } from "./leonardo-provider.constants";

function isTransientStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

/**
 * Fetches a generated result that has already been paid for. A network
 * error or a transient status is retried after a short pause, a bounded
 * number of times and always under the caller's abort signal, so a brief
 * CDN failure does not cost a whole new generation. Any other status is
 * returned at once for the caller to classify.
 */
export async function downloadProviderResult(
  url: string,
  fetcher: typeof fetch,
  signal: AbortSignal,
  sleep: (milliseconds: number) => Promise<void>,
): Promise<Response> {
  for (const delay of LEONARDO_DOWNLOAD_RETRY_DELAYS_MS) {
    try {
      const response = await fetcher(url, { redirect: "error", signal });
      if (!isTransientStatus(response.status)) return response;
      await response.body?.cancel();
    } catch (error) {
      if (signal.aborted) throw error;
    }
    await sleep(delay);
    signal.throwIfAborted();
  }
  return fetcher(url, { redirect: "error", signal });
}
