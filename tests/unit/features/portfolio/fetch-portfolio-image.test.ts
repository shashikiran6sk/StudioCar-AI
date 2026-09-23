import { describe, expect, it, vi } from "vitest";

import { fetchPortfolioImage } from "../../../../apps/web/src/features/portfolio/fetch-portfolio-image";

describe("fetchPortfolioImage", () => {
  it("reads the bytes without sending the application's cookies", async () => {
    const fetchResource = vi.fn((_url: string, _init: RequestInit) =>
      Promise.resolve(new Response(new Uint8Array([7, 8, 9]))),
    );

    await expect(
      fetchPortfolioImage("https://assets.example.test/a.webp", fetchResource),
    ).resolves.toEqual(new Uint8Array([7, 8, 9]));
    expect(fetchResource).toHaveBeenCalledWith("https://assets.example.test/a.webp", {
      credentials: "omit",
    });
  });

  it("fails rather than zipping an error page, such as an expired link", async () => {
    await expect(
      fetchPortfolioImage("https://assets.example.test/a.webp", () =>
        Promise.resolve(new Response("expired", { status: 403 })),
      ),
    ).rejects.toThrow("403");
  });
});
