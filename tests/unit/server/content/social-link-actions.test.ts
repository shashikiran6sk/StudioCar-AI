import { afterEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const isCurrentUserAdministrator = vi.fn();
const save = vi.fn();
const remove = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession,
}));
vi.mock(
  "../../../../apps/web/src/server/admin/is-current-user-administrator",
  () => ({ isCurrentUserAdministrator }),
);
vi.mock("../../../../apps/web/src/server/content/social-link-runtime", () => ({
  getSocialLinkRepository: () => ({ save, remove }),
}));

const { removeSocialLinkAction, saveSocialLinkAction } = await import(
  "../../../../apps/web/src/server/content/social-link-actions"
);

const ADMIN_ID = "8c879f46-1193-4d77-b785-057fe026d111";

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const fields: Record<string, string> = {
    enabled: "on",
    label: "Instagram",
    platform: "INSTAGRAM",
    url: "https://instagram.com/studiocar",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function signedInAdministrator() {
  getCurrentSession.mockResolvedValue({ userId: ADMIN_ID });
  isCurrentUserAdministrator.mockResolvedValue(true);
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("saveSocialLinkAction", () => {
  it("saves a link and refreshes the page that shows it", async () => {
    signedInAdministrator();

    const result = await saveSocialLinkAction(null, form());

    expect(result.kind).toBe("success");
    expect(save).toHaveBeenCalledWith({
      actorUserId: ADMIN_ID,
      displayOrder: 0,
      link: {
        enabled: true,
        label: "Instagram",
        platform: "INSTAGRAM",
        url: "https://instagram.com/studiocar",
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("takes the footer position from the catalog, not the submission", async () => {
    signedInAdministrator();

    await saveSocialLinkAction(
      null,
      form({ displayOrder: "99", platform: "YOUTUBE" }),
    );

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ displayOrder: 3 }),
    );
  });

  it("reads an absent checkbox as hidden", async () => {
    signedInAdministrator();
    const data = form();
    data.delete("enabled");

    await saveSocialLinkAction(null, data);

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        link: expect.objectContaining({ enabled: false }),
      }),
    );
  });

  it("refuses a plaintext address", async () => {
    signedInAdministrator();

    const result = await saveSocialLinkAction(
      null,
      form({ url: "http://instagram.com/studiocar" }),
    );

    expect(result.kind).toBe("error");
    expect(save).not.toHaveBeenCalled();
  });

  it("refuses an address that carries a password", async () => {
    signedInAdministrator();

    const result = await saveSocialLinkAction(
      null,
      form({ url: "https://studiocar.example@evil.example/" }),
    );

    expect(result.kind).toBe("error");
    expect(save).not.toHaveBeenCalled();
  });

  it("refuses a platform the footer cannot render", async () => {
    signedInAdministrator();

    const result = await saveSocialLinkAction(
      null,
      form({ platform: "MYSPACE" }),
    );

    expect(result).toEqual({
      kind: "error",
      message: "The footer does not know how to show that platform.",
    });
    expect(save).not.toHaveBeenCalled();
  });

  it("refuses a signed-out caller", async () => {
    getCurrentSession.mockResolvedValue(null);

    expect((await saveSocialLinkAction(null, form())).kind).toBe("error");
    expect(save).not.toHaveBeenCalled();
  });

  it("refuses a signed-in caller who is not an administrator", async () => {
    getCurrentSession.mockResolvedValue({ userId: ADMIN_ID });
    isCurrentUserAdministrator.mockResolvedValue(false);

    expect((await saveSocialLinkAction(null, form())).kind).toBe("error");
    expect(save).not.toHaveBeenCalled();
  });

  it("reports a failed write instead of claiming it saved", async () => {
    signedInAdministrator();
    save.mockRejectedValue(new Error("constraint violated"));

    expect((await saveSocialLinkAction(null, form())).kind).toBe("error");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("removeSocialLinkAction", () => {
  it("removes a configured link", async () => {
    signedInAdministrator();
    remove.mockResolvedValue(true);

    const data = new FormData();
    data.set("platform", "INSTAGRAM");

    expect((await removeSocialLinkAction(null, data)).kind).toBe("success");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("says so when there was nothing to remove", async () => {
    signedInAdministrator();
    remove.mockResolvedValue(false);

    const data = new FormData();
    data.set("platform", "INSTAGRAM");

    expect((await removeSocialLinkAction(null, data)).kind).toBe("error");
  });

  it("refuses a caller who is not an administrator", async () => {
    getCurrentSession.mockResolvedValue({ userId: ADMIN_ID });
    isCurrentUserAdministrator.mockResolvedValue(false);

    const data = new FormData();
    data.set("platform", "INSTAGRAM");

    expect((await removeSocialLinkAction(null, data)).kind).toBe("error");
    expect(remove).not.toHaveBeenCalled();
  });
});
