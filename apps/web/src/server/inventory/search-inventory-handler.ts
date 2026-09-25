import { randomUUID } from "node:crypto";
import { InventorySearchQuerySchema } from "@studiocar/contracts";

import { createApiErrorResponse } from "../auth/create-api-error-response";
import type { ActiveSession } from "../auth/session-service";
import {
  INVENTORY_SEARCH_BAD_REQUEST_MESSAGE,
  INVENTORY_SEARCH_CACHE_CONTROL,
  INVENTORY_SEARCH_UNAUTHENTICATED_MESSAGE,
  INVENTORY_SEARCH_UNAVAILABLE_MESSAGE,
} from "./inventory.constants";
import type { InventorySearchApplication } from "./inventory.types";

export async function handleSearchInventory(
  request: Request,
  session: ActiveSession | null,
  inventory: InventorySearchApplication,
  createRequestId: () => string = randomUUID,
): Promise<Response> {
  if (!session) {
    return createApiErrorResponse({
      code: "UNAUTHENTICATED",
      message: INVENTORY_SEARCH_UNAUTHENTICATED_MESSAGE,
      requestId: createRequestId(),
      status: 401,
    });
  }

  const searchParams = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = InventorySearchQuerySchema.safeParse(searchParams);
  if (!parsed.success) {
    return createApiErrorResponse({
      code: "BAD_REQUEST",
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: INVENTORY_SEARCH_BAD_REQUEST_MESSAGE,
      requestId: createRequestId(),
      status: 400,
    });
  }

  try {
    const page = await inventory.search(session.userId, parsed.data);
    return Response.json(page, {
      headers: { "cache-control": INVENTORY_SEARCH_CACHE_CONTROL },
    });
  } catch {
    return createApiErrorResponse({
      code: "SERVICE_UNAVAILABLE",
      message: INVENTORY_SEARCH_UNAVAILABLE_MESSAGE,
      requestId: createRequestId(),
      status: 503,
    });
  }
}
