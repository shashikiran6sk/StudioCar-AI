export type FetchResource = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Reads one processed image straight from private storage through its
 * short-lived signed URL, so the bytes never pass through the application.
 */
export async function fetchPortfolioImage(
  url: string,
  fetchResource: FetchResource = fetch,
): Promise<Uint8Array> {
  const response = await fetchResource(url, { credentials: "omit" });
  if (!response.ok) {
    throw new Error(`Image request failed with status ${String(response.status)}.`);
  }
  return new Uint8Array(await response.arrayBuffer());
}
