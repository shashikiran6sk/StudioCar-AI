import type { SocialLink, SocialPlatform } from "@studiocar/contracts";
import type { PrismaClient } from "@studiocar/database-runtime";
import { Prisma } from "@studiocar/database-runtime";

import {
  AUDIT_ACTION_SOCIAL_LINK_REMOVED,
  AUDIT_ACTION_SOCIAL_LINK_SAVED,
  AUDIT_RESOURCE_SOCIAL_LINK,
  SOCIAL_LINK_LOCK_KEY,
} from "../../content/content.constants";

const socialLinkSelect = {
  enabled: true,
  label: true,
  platform: true,
  url: true,
  displayOrder: true,
} satisfies Prisma.SocialLinkSelect;

export type SocialLinkRecord = Prisma.SocialLinkGetPayload<{
  select: typeof socialLinkSelect;
}>;

export class PrismaSocialLinkRepository {
  public constructor(private readonly database: PrismaClient) {}

  /** What the public footer renders, in the order it renders it. */
  public findEnabled(): Promise<SocialLinkRecord[]> {
    return this.database.socialLink.findMany({
      where: { enabled: true },
      orderBy: [{ displayOrder: "asc" }, { platform: "asc" }],
      select: socialLinkSelect,
    });
  }

  /** Every configured link, including ones an administrator has hidden. */
  public findAll(): Promise<SocialLinkRecord[]> {
    return this.database.socialLink.findMany({
      orderBy: [{ displayOrder: "asc" }, { platform: "asc" }],
      select: socialLinkSelect,
    });
  }

  /**
   * Saves one platform's link.
   *
   * `displayOrder` comes from the shipped catalog rather than from the form.
   * The footer's order is a design decision, not something to retype on every
   * edit and get wrong.
   */
  public async save(command: {
    actorUserId: string;
    displayOrder: number;
    link: SocialLink;
  }): Promise<void> {
    await this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${SOCIAL_LINK_LOCK_KEY} || ${command.link.platform}, 0))`;

      await transaction.socialLink.upsert({
        where: { platform: command.link.platform },
        update: {
          enabled: command.link.enabled,
          label: command.link.label,
          url: command.link.url,
          displayOrder: command.displayOrder,
        },
        create: {
          platform: command.link.platform,
          enabled: command.link.enabled,
          label: command.link.label,
          url: command.link.url,
          displayOrder: command.displayOrder,
        },
      });
      await transaction.auditLog.create({
        data: {
          userId: command.actorUserId,
          action: AUDIT_ACTION_SOCIAL_LINK_SAVED,
          resourceType: AUDIT_RESOURCE_SOCIAL_LINK,
          resourceId: command.link.platform,
          // The address is public, so recording it discloses nothing.
          metadata: {
            enabled: command.link.enabled,
            url: command.link.url,
          },
        },
      });
    });
  }

  /** Removes a platform's link entirely, so the footer stops showing it. */
  public remove(command: {
    actorUserId: string;
    platform: SocialPlatform;
  }): Promise<boolean> {
    return this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${SOCIAL_LINK_LOCK_KEY} || ${command.platform}, 0))`;

      const removed = await transaction.socialLink.deleteMany({
        where: { platform: command.platform },
      });
      if (removed.count === 0) return false;

      await transaction.auditLog.create({
        data: {
          userId: command.actorUserId,
          action: AUDIT_ACTION_SOCIAL_LINK_REMOVED,
          resourceType: AUDIT_RESOURCE_SOCIAL_LINK,
          resourceId: command.platform,
        },
      });
      return true;
    });
  }
}
