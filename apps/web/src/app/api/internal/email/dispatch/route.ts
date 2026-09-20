import { handleDispatchEmailOutbox } from "../../../../../server/email/dispatch-email-outbox-handler";
import { getEmailRuntime } from "../../../../../server/email/email-runtime";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const email = getEmailRuntime();
  return handleDispatchEmailOutbox(
    request,
    email.dispatchToken,
    email.dispatcher,
  );
}
