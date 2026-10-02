import { withRouteMonitoring } from "../../../../server/observability/with-route-monitoring";
import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { getInventoryService } from "../../../../server/inventory/inventory-runtime";
import { handleSearchInventory } from "../../../../server/inventory/search-inventory-handler";

export const runtime = "nodejs";

async function handleGET(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  return handleSearchInventory(request, session, getInventoryService());
}

export const GET = withRouteMonitoring("/api/inventory/search", handleGET);
