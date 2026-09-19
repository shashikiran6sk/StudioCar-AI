import { getCurrentSession } from "../../../server/auth/get-current-session";
import { handleCreateVehicle } from "../../../server/vehicles/create-vehicle-handler";
import { getVehicleService } from "../../../server/vehicles/vehicle-runtime";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  return handleCreateVehicle(request, session, getVehicleService());
}
