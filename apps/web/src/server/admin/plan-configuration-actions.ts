"use server";

import { revalidatePath } from "next/cache";

import {
  ADMIN_ACTION_FAILED_MESSAGE,
  ADMIN_FORBIDDEN_MESSAGE,
  ADMIN_PLAN_INVALID_MESSAGE,
  ADMIN_PLAN_SAVED_MESSAGE,
  ADMIN_PLAN_UNKNOWN_MESSAGE,
  ADMIN_PRICING_PATH,
} from "./admin.constants";
import { isCurrentUserAdministrator } from "./is-current-user-administrator";
import type { AdminActionMessage } from "./to-admin-action-message";
import { getCurrentSession } from "../auth/get-current-session";
import { BILLING_PATH, HOME_PATH } from "../../app/app-routes";
import { DEFAULT_PLAN_CONFIGURATIONS } from "../plans/default-plan-configurations";
import {
  PlanConfigurationFormSchema,
  readPlanConfigurationForm,
} from "../plans/plan-configuration-form";
import { getPlanConfigRepository } from "../plans/plan-config-runtime";

const forbidden: AdminActionMessage = {
  kind: "error",
  message: ADMIN_FORBIDDEN_MESSAGE,
};

/**
 * Saves one plan's configuration.
 *
 * A server action is an endpoint, so it authorizes against the database for
 * itself rather than trusting that the page was only rendered for an
 * administrator.
 *
 * Only a plan the deployment ships can be edited. That keeps `planKey` — which
 * existing subscriptions are keyed by — a closed set, so no edit can invent a
 * plan that nothing else in the product understands.
 */
export async function savePlanConfigurationAction(
  _previous: AdminActionMessage | null,
  formData: FormData,
): Promise<AdminActionMessage> {
  const session = await getCurrentSession();
  if (!session) return forbidden;
  if (!(await isCurrentUserAdministrator())) return forbidden;

  const planKey = formData.get("planKey");
  const fallback = DEFAULT_PLAN_CONFIGURATIONS.find(
    (plan) => plan.planKey === planKey,
  );
  if (!fallback) return { kind: "error", message: ADMIN_PLAN_UNKNOWN_MESSAGE };

  const parsed = PlanConfigurationFormSchema.safeParse(
    readPlanConfigurationForm(formData),
  );
  if (!parsed.success) {
    return { kind: "error", message: ADMIN_PLAN_INVALID_MESSAGE };
  }

  try {
    await getPlanConfigRepository().update({
      actorUserId: session.userId,
      fallback,
      planKey: fallback.planKey,
      update: parsed.data,
    });
  } catch {
    return { kind: "error", message: ADMIN_ACTION_FAILED_MESSAGE };
  }

  // Every surface that quotes a price or an allowance.
  revalidatePath(ADMIN_PRICING_PATH);
  revalidatePath(BILLING_PATH);
  revalidatePath(HOME_PATH);
  return { kind: "success", message: ADMIN_PLAN_SAVED_MESSAGE };
}
