import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { handleUpdateVehicle } from "../../../../server/vehicles/update-vehicle-handler";
import { getVehicleService } from "../../../../server/vehicles/vehicle-runtime";

export const runtime = "nodejs";

interface UpdateVehicleRouteContext {
  params: Promise<{ vehicleId: string }>;
}

export async function PATCH(
  request: Request,
  context: UpdateVehicleRouteContext,
): Promise<Response> {
  const [session, path] = await Promise.all([
    getCurrentSession(),
    context.params,
  ]);
  return handleUpdateVehicle(request, path, session, getVehicleService());
}
