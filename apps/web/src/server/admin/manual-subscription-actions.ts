"use server";

import {
  ManualSubscriptionAssignmentSchema,
  type PlanCatalogEntry,
} from "@studiocar/contracts";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  ADMIN_ACTION_FAILED_MESSAGE,
  ADMIN_FORBIDDEN_MESSAGE,
  ADMIN_SUBSCRIPTION_ASSIGNED_MESSAGE,
  ADMIN_SUBSCRIPTION_ENDED_MESSAGE,
  ADMIN_SUBSCRIPTION_NOT_ASSIGNED_MESSAGE,
  ADMIN_SUBSCRIPTION_PROVIDER_MANAGED_MESSAGE,
  ADMIN_SUBSCRIPTION_REPLACED_MESSAGE,
  ADMIN_SUBSCRIPTION_UNKNOWN_ACCOUNT_MESSAGE,
  ADMIN_SUBSCRIPTION_UNKNOWN_PLAN_MESSAGE,
  ADMIN_SUBSCRIPTIONS_PATH,
} from "./admin.constants";
import { calculateSubscriptionPeriodEnd } from "./calculate-subscription-period-end";
import { isCurrentUserAdministrator } from "./is-current-user-administrator";
import { getManualSubscriptionRepository } from "./manual-subscription-runtime";
import type { AdminActionMessage } from "./to-admin-action-message";
import { getCurrentSession } from "../auth/get-current-session";
import { BILLING_PATH } from "../../app/app-routes";
import { getPlanCatalog } from "../plans/get-plan-catalog";

const forbidden: AdminActionMessage = {
  kind: "error",
  message: ADMIN_FORBIDDEN_MESSAGE,
};

const MonthsSchema = z.string().trim().regex(/^\d+$/).transform(Number);
const IdSchema = z.uuid();

/** Every action authorizes against the database for itself. */
async function requireActingAdministrator(): Promise<string | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  if (!(await isCurrentUserAdministrator())) return null;
  return session.userId;
}

function isOffered(
  catalog: readonly PlanCatalogEntry[],
  planKey: string,
): boolean {
  return catalog.some((plan) => plan.active && plan.planKey === planKey);
}

/**
 * Grants a paid offering to one account without recording a provider payment.
 *
 * The plan must be one the catalog currently offers, so an assignment cannot
 * put somebody on a plan the product no longer describes.
 */
export async function assignSubscriptionAction(
  _previous: AdminActionMessage | null,
  formData: FormData,
): Promise<AdminActionMessage> {
  const actorUserId = await requireActingAdministrator();
  if (!actorUserId) return forbidden;

  const note = formData.get("note");
  const assignment = ManualSubscriptionAssignmentSchema.safeParse({
    months: MonthsSchema.safeParse(formData.get("months")).data,
    planKey: formData.get("planKey"),
    userId: formData.get("userId"),
    ...(typeof note === "string" && note.trim() !== "" ? { note } : {}),
  });
  if (!assignment.success) {
    return { kind: "error", message: ADMIN_ACTION_FAILED_MESSAGE };
  }

  if (!isOffered(await getPlanCatalog(), assignment.data.planKey)) {
    return { kind: "error", message: ADMIN_SUBSCRIPTION_UNKNOWN_PLAN_MESSAGE };
  }

  try {
    if (assignment.data.planKey === "STUDIO_PLUS") {
      const result = await getManualSubscriptionRepository().grantPlusCredits({
        actorUserId,
        userId: assignment.data.userId,
        ...(assignment.data.note ? { note: assignment.data.note } : {}),
      });
      revalidatePath(BILLING_PATH);
      return result === "GRANTED"
        ? { kind: "success", message: "Studio Plus credits granted." }
        : { kind: "error", message: ADMIN_SUBSCRIPTION_UNKNOWN_ACCOUNT_MESSAGE };
    }
    const now = new Date();
    const result = await getManualSubscriptionRepository().assign({
      actorUserId,
      assignment: assignment.data,
      now,
      periodEnd: calculateSubscriptionPeriodEnd(now, assignment.data.months),
    });
    revalidatePath(ADMIN_SUBSCRIPTIONS_PATH);
    revalidatePath(BILLING_PATH);

    switch (result.kind) {
      case "ASSIGNED":
        return {
          kind: "success",
          message: ADMIN_SUBSCRIPTION_ASSIGNED_MESSAGE,
        };
      case "REPLACED":
        return {
          kind: "success",
          message: ADMIN_SUBSCRIPTION_REPLACED_MESSAGE,
        };
      case "PROVIDER_MANAGED":
        return {
          kind: "error",
          message: ADMIN_SUBSCRIPTION_PROVIDER_MANAGED_MESSAGE,
        };
      case "UNKNOWN_ACCOUNT":
        return {
          kind: "error",
          message: ADMIN_SUBSCRIPTION_UNKNOWN_ACCOUNT_MESSAGE,
        };
    }
  } catch {
    return { kind: "error", message: ADMIN_ACTION_FAILED_MESSAGE };
  }
}

export async function revokeSubscriptionAction(
  _previous: AdminActionMessage | null,
  formData: FormData,
): Promise<AdminActionMessage> {
  const actorUserId = await requireActingAdministrator();
  if (!actorUserId) return forbidden;

  const userId = IdSchema.safeParse(formData.get("userId"));
  if (!userId.success) {
    return { kind: "error", message: ADMIN_ACTION_FAILED_MESSAGE };
  }

  try {
    const result = await getManualSubscriptionRepository().revoke({
      actorUserId,
      now: new Date(),
      userId: userId.data,
    });
    revalidatePath(ADMIN_SUBSCRIPTIONS_PATH);
    revalidatePath(BILLING_PATH);

    return result.kind === "REVOKED"
      ? { kind: "success", message: ADMIN_SUBSCRIPTION_ENDED_MESSAGE }
      : {
          kind: "error",
          message: ADMIN_SUBSCRIPTION_NOT_ASSIGNED_MESSAGE,
        };
  } catch {
    return { kind: "error", message: ADMIN_ACTION_FAILED_MESSAGE };
  }
}
