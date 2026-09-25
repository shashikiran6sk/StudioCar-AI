import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { getInventoryService } from "../../../../server/inventory/inventory-runtime";
import { handleSearchInventory } from "../../../../server/inventory/search-inventory-handler";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  return handleSearchInventory(request, session, getInventoryService());
}
