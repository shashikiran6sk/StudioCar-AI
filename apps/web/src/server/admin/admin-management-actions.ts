"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  ADMIN_ACTION_FAILED_MESSAGE,
  ADMIN_FORBIDDEN_MESSAGE,
  ADMIN_INVALID_EMAIL_MESSAGE,
  ADMIN_INVITE_REVOKED_MESSAGE,
  ADMINS_PATH,
} from "./admin.constants";
import { getAdminManagementRepository } from "./admin-management-runtime";
import { calculateInviteExpiry } from "./calculate-invite-expiry";
import { isCurrentUserAdministrator } from "./is-current-user-administrator";
import { normalizeAdminEmail } from "./normalize-admin-email";
import {
  toGrantMessage,
  toRevokeMessage,
  type AdminActionMessage,
} from "./to-admin-action-message";
import { getCurrentSession } from "../auth/get-current-session";

/** Normalised before validation: `z.email()` checks the format first. */
const EmailSchema = z.string().trim().toLowerCase().pipe(z.email());
const IdSchema = z.uuid();

/**
 * Every action authorizes for itself against the database.
 *
 * The administration navigation entry is hidden from other people, but that is
 * presentation: a server action is an endpoint, and nothing stops somebody
 * invoking one directly.
 */
async function requireActingAdministrator(): Promise<string | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  if (!(await isCurrentUserAdministrator())) return null;
  return session.userId;
}

const forbidden: AdminActionMessage = {
  kind: "error",
  message: ADMIN_FORBIDDEN_MESSAGE,
};

export async function grantAdministratorAction(
  _previous: AdminActionMessage | null,
  formData: FormData,
): Promise<AdminActionMessage> {
  const actorUserId = await requireActingAdministrator();
  if (!actorUserId) return forbidden;

  const email = EmailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    return { kind: "error", message: ADMIN_INVALID_EMAIL_MESSAGE };
  }

  try {
    const now = new Date();
    const result = await getAdminManagementRepository().grantOrInvite({
      email: normalizeAdminEmail(email.data),
      actorUserId,
      now,
      expiresAt: calculateInviteExpiry(now),
    });
    revalidatePath(ADMINS_PATH);
    return toGrantMessage(result);
  } catch {
    return { kind: "error", message: ADMIN_ACTION_FAILED_MESSAGE };
  }
}

export async function revokeAdministratorAction(
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
    const result = await getAdminManagementRepository().revoke({
      userId: userId.data,
      actorUserId,
    });
    revalidatePath(ADMINS_PATH);
    return toRevokeMessage(result);
  } catch {
    return { kind: "error", message: ADMIN_ACTION_FAILED_MESSAGE };
  }
}

export async function revokeInvitationAction(
  _previous: AdminActionMessage | null,
  formData: FormData,
): Promise<AdminActionMessage> {
  const actorUserId = await requireActingAdministrator();
  if (!actorUserId) return forbidden;

  const inviteId = IdSchema.safeParse(formData.get("inviteId"));
  if (!inviteId.success) {
    return { kind: "error", message: ADMIN_ACTION_FAILED_MESSAGE };
  }

  try {
    const revoked = await getAdminManagementRepository().revokeInvite({
      inviteId: inviteId.data,
      actorUserId,
    });
    revalidatePath(ADMINS_PATH);
    return revoked
      ? { kind: "success", message: ADMIN_INVITE_REVOKED_MESSAGE }
      : { kind: "error", message: ADMIN_ACTION_FAILED_MESSAGE };
  } catch {
    return { kind: "error", message: ADMIN_ACTION_FAILED_MESSAGE };
  }
}
