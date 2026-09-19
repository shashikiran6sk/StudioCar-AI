import { describe, expect, it } from "vitest";

import {
  AccountProfileSchema,
  UpdateProfileSchema,
} from "../../../packages/contracts/src/profile";

describe("profile contracts", () => {
  it("trims and validates an editable display name", () => {
    expect(UpdateProfileSchema.parse({ displayName: "  Priya Sharma  " }))
      .toEqual({ displayName: "Priya Sharma" });
    expect(UpdateProfileSchema.safeParse({ displayName: "P" }).success).toBe(
      false,
    );
  });

  it("accepts linked identities without provider subjects", () => {
    expect(
      AccountProfileSchema.parse({
        user: {
          id: "user-1",
          displayName: "Priya Sharma",
          primaryEmail: "priya@example.com",
          primaryPhone: null,
        },
        identities: [
          {
            provider: "GOOGLE",
            email: "priya@example.com",
            phoneNumber: null,
            linkedAt: "2026-09-19T00:00:00.000Z",
            lastAuthenticatedAt: "2026-09-19T01:00:00.000Z",
          },
        ],
        activeSessionCount: 2,
      }),
    ).toMatchObject({ activeSessionCount: 2 });
  });
});
