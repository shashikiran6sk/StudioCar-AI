import { cookies } from "next/headers";
import { cache } from "react";

import { sessionCookieName } from "./session-cookie";
import { getSessionService } from "./session-runtime";
import type { ActiveSession } from "./session-service";

async function readCurrentSession(): Promise<ActiveSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(
    sessionCookieName(process.env.NODE_ENV === "production"),
  )?.value;

  return token ? getSessionService().authenticate(token) : null;
}

export const getCurrentSession = cache(readCurrentSession);
