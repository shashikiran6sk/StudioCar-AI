import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaSocialLinkRepository } from "../../../../../apps/web/src/server/db/repositories/social-link-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
/**
 * Unique per run. The whole integration suite shares one database, and a
 * fixture another process can delete makes this file fail on timing rather
 * than on behaviour.
 */
const actorEmail = `content-editor-${randomUUID()}@integration.studiocar.test`;

const instagram = {
  enabled: true,
  label: "Instagram",
  platform: "INSTAGRAM" as const,
  url: "https://instagram.com/studiocar",
};

databaseDescribe("PrismaSocialLinkRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaSocialLinkRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaSocialLinkRepository(database);
  });

  afterEach(async () => {
    await database.auditLog.deleteMany({
      where: { resourceType: "SocialLink" },
    });
    await database.socialLink.deleteMany({});
    await database.user.deleteMany({ where: { primaryEmail: actorEmail } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  async function createActor() {
    return database.user.create({
      data: { primaryEmail: actorEmail, displayName: "Content Editor" },
    });
  }

  it("saves a link and records who did it", async () => {
    const actor = await createActor();

    await repository.save({
      actorUserId: actor.id,
      displayOrder: 0,
      link: instagram,
    });

    await expect(repository.findEnabled()).resolves.toMatchObject([
      { platform: "INSTAGRAM", url: instagram.url, enabled: true },
    ]);
    const audit = await database.auditLog.findFirstOrThrow({
      where: { resourceType: "SocialLink", userId: actor.id },
      select: { action: true, resourceId: true, userId: true },
    });
    expect(audit).toEqual({
      action: "SOCIAL_LINK_SAVED",
      resourceId: "INSTAGRAM",
      userId: actor.id,
    });
  });

  it("replaces a platform's link rather than adding a second", async () => {
    const actor = await createActor();
    await repository.save({
      actorUserId: actor.id,
      displayOrder: 0,
      link: instagram,
    });

    await repository.save({
      actorUserId: actor.id,
      displayOrder: 0,
      link: { ...instagram, url: "https://instagram.com/studiocar-india" },
    });

    const stored = await repository.findAll();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.url).toBe("https://instagram.com/studiocar-india");
  });

  it("hides a link without forgetting it", async () => {
    const actor = await createActor();
    await repository.save({
      actorUserId: actor.id,
      displayOrder: 0,
      link: instagram,
    });

    await repository.save({
      actorUserId: actor.id,
      displayOrder: 0,
      link: { ...instagram, enabled: false },
    });

    await expect(repository.findEnabled()).resolves.toEqual([]);
    await expect(repository.findAll()).resolves.toMatchObject([
      { platform: "INSTAGRAM", enabled: false },
    ]);
  });

  it("returns enabled links in the order the footer renders them", async () => {
    const actor = await createActor();
    // Saved out of order on purpose.
    await repository.save({
      actorUserId: actor.id,
      displayOrder: 3,
      link: {
        enabled: true,
        label: "YouTube",
        platform: "YOUTUBE",
        url: "https://youtube.com/@studiocar",
      },
    });
    await repository.save({
      actorUserId: actor.id,
      displayOrder: 0,
      link: instagram,
    });

    await expect(
      (await repository.findEnabled()).map((link) => link.platform),
    ).toEqual(["INSTAGRAM", "YOUTUBE"]);
  });

  it("refuses a plaintext address at the database itself", async () => {
    const actor = await createActor();

    // The contract refuses this first; the constraint is the second line.
    await expect(
      repository.save({
        actorUserId: actor.id,
        displayOrder: 0,
        link: { ...instagram, url: "http://instagram.com/studiocar" },
      }),
    ).rejects.toThrow();
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it("removes a link and records that it happened", async () => {
    const actor = await createActor();
    await repository.save({
      actorUserId: actor.id,
      displayOrder: 0,
      link: instagram,
    });

    await expect(
      repository.remove({ actorUserId: actor.id, platform: "INSTAGRAM" }),
    ).resolves.toBe(true);
    await expect(repository.findAll()).resolves.toEqual([]);
    expect(
      await database.auditLog.count({
        where: { action: "SOCIAL_LINK_REMOVED" },
      }),
    ).toBe(1);
  });

  it("reports a platform that has nothing to remove", async () => {
    const actor = await createActor();

    await expect(
      repository.remove({ actorUserId: actor.id, platform: "FACEBOOK" }),
    ).resolves.toBe(false);
    expect(
      await database.auditLog.count({ where: { resourceType: "SocialLink" } }),
    ).toBe(0);
  });

  it("leaves one link when two administrators save at once", async () => {
    const actor = await createActor();

    await Promise.all([
      repository.save({
        actorUserId: actor.id,
        displayOrder: 0,
        link: { ...instagram, url: "https://instagram.com/one" },
      }),
      repository.save({
        actorUserId: actor.id,
        displayOrder: 0,
        link: { ...instagram, url: "https://instagram.com/two" },
      }),
    ]);

    await expect(repository.findAll()).resolves.toHaveLength(1);
  });
});
