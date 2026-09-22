"use server";

import { SocialLinkSchema, SocialPlatformSchema } from "@studiocar/contracts";
import { revalidatePath } from "next/cache";

import {
  CONTENT_PATH,
  SOCIAL_LINK_INVALID_MESSAGE,
  SOCIAL_LINK_NOT_CONFIGURED_MESSAGE,
  SOCIAL_LINK_REMOVED_MESSAGE,
  SOCIAL_LINK_SAVED_MESSAGE,
  SOCIAL_LINK_UNKNOWN_PLATFORM_MESSAGE,
} from "./content.constants";
import { getSocialLinkRepository } from "./social-link-runtime";
import { SOCIAL_PLATFORM_CATALOG } from "./social-platform-catalog";
import {
  ADMIN_ACTION_FAILED_MESSAGE,
  ADMIN_FORBIDDEN_MESSAGE,
} from "../admin/admin.constants";
import { isCurrentUserAdministrator } from "../admin/is-current-user-administrator";
import type { AdminActionMessage } from "../admin/to-admin-action-message";
import { getCurrentSession } from "../auth/get-current-session";
import { HOME_PATH } from "../../app/app-routes";

const forbidden: AdminActionMessage = {
  kind: "error",
  message: ADMIN_FORBIDDEN_MESSAGE,
};

/** Every action authorizes against the database for itself. */
async function requireActingAdministrator(): Promise<string | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  if (!(await isCurrentUserAdministrator())) return null;
  return session.userId;
}

/**
 * Saves the address the footer sends people to for one platform.
 *
 * The platform must be one the footer knows how to render, and its position in
 * the footer comes from the shipped catalog rather than from the submission.
 */
export async function saveSocialLinkAction(
  _previous: AdminActionMessage | null,
  formData: FormData,
): Promise<AdminActionMessage> {
  const actorUserId = await requireActingAdministrator();
  if (!actorUserId) return forbidden;

  const platform = SocialPlatformSchema.safeParse(formData.get("platform"));
  const presentation = platform.success
    ? SOCIAL_PLATFORM_CATALOG.find((entry) => entry.platform === platform.data)
    : undefined;
  if (!presentation) {
    return { kind: "error", message: SOCIAL_LINK_UNKNOWN_PLATFORM_MESSAGE };
  }

  const link = SocialLinkSchema.safeParse({
    enabled: formData.get("enabled") !== null,
    label: formData.get("label"),
    platform: presentation.platform,
    url: formData.get("url"),
  });
  if (!link.success) {
    return { kind: "error", message: SOCIAL_LINK_INVALID_MESSAGE };
  }

  try {
    await getSocialLinkRepository().save({
      actorUserId,
      displayOrder: presentation.displayOrder,
      link: link.data,
    });
  } catch {
    return { kind: "error", message: ADMIN_ACTION_FAILED_MESSAGE };
  }

  revalidatePath(CONTENT_PATH);
  revalidatePath(HOME_PATH);
  return { kind: "success", message: SOCIAL_LINK_SAVED_MESSAGE };
}

export async function removeSocialLinkAction(
  _previous: AdminActionMessage | null,
  formData: FormData,
): Promise<AdminActionMessage> {
  const actorUserId = await requireActingAdministrator();
  if (!actorUserId) return forbidden;

  const platform = SocialPlatformSchema.safeParse(formData.get("platform"));
  if (!platform.success) {
    return { kind: "error", message: SOCIAL_LINK_UNKNOWN_PLATFORM_MESSAGE };
  }

  try {
    const removed = await getSocialLinkRepository().remove({
      actorUserId,
      platform: platform.data,
    });
    revalidatePath(CONTENT_PATH);
    revalidatePath(HOME_PATH);
    return removed
      ? { kind: "success", message: SOCIAL_LINK_REMOVED_MESSAGE }
      : { kind: "error", message: SOCIAL_LINK_NOT_CONFIGURED_MESSAGE };
  } catch {
    return { kind: "error", message: ADMIN_ACTION_FAILED_MESSAGE };
  }
}
