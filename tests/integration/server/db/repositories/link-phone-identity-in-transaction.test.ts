import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { linkPhoneIdentityInTransaction } from "../../../../../apps/web/src/server/db/repositories/link-phone-identity-in-transaction";
import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const PHONE = "+918765432107";
const EMAIL = "link-phone-transaction@example.test";

databaseDescribe("linkPhoneIdentityInTransaction", () => {
  let database: ReturnType<typeof createDatabaseClient>;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
  });

  afterEach(async () => {
    await database.user.deleteMany({ where: { primaryEmail: EMAIL } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("shares profile linking semantics with verified-phone Google onboarding", async () => {
    const user = await database.user.create({
      data: { primaryEmail: EMAIL },
      select: { id: true },
    });
    const command = {
      userId: user.id,
      phoneNumber: PHONE,
      linkedAt: new Date("2026-09-24T12:00:00.000Z"),
    };
    await expect(database.$transaction((transaction) =>
      linkPhoneIdentityInTransaction(transaction, command),
    )).resolves.toEqual({ status: "linked" });
    await expect(database.$transaction((transaction) =>
      linkPhoneIdentityInTransaction(transaction, command),
    )).resolves.toEqual({ status: "already_linked" });
    await expect(
      database.authIdentity.count({ where: { providerSubject: PHONE } }),
    ).resolves.toBe(1);
  });
});
