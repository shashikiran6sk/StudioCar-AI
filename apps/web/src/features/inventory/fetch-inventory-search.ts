import { InventoryPageSchema, type InventoryPage } from "@studiocar/contracts";

export async function fetchInventorySearch(
  url: string,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<InventoryPage> {
  const response = await fetcher(url, { signal });
  if (!response.ok) throw new Error("Inventory search failed.");
  const body: unknown = await response.json();
  return InventoryPageSchema.parse(body);
}
