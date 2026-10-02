import { expect, test } from "@playwright/test";

test("serves canonical homepage metadata, navigation, and SEO assets", async ({ page, request }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("StudioCar AI | AI Car Photography for Dealers");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /studio-quality images/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://studiocarai.com/");
  expect(await page.locator('link[rel="canonical"]').count()).toBe(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, nofollow/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /StudioCar AI/);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /studio-quality images/);
  expect(new URL(await page.locator('meta[property="og:url"]').getAttribute("content") ?? "").href)
    .toBe("https://studiocarai.com/");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "StudioCar AI");
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", "https://studiocarai.com/opengraph-image.png");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", "https://studiocarai.com/opengraph-image.png");
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", "/icon.png");
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("sizes", "192x192");
  await expect(page.locator('link[rel="icon"][href="/favicon.ico"]')).toHaveAttribute("sizes", "16x16 32x32 48x48");
  expect(await page.locator("h1").count()).toBe(1);

  const structuredData = page.locator('script[type="application/ld+json"]');
  const data: unknown = JSON.parse(await structuredData.textContent() ?? "");
  expect(data).toMatchObject({ "@type": "SoftwareApplication", url: "https://studiocarai.com/" });

  for (const section of ["features", "workflow", "studio-backgrounds", "pricing"]) {
    const link = page.getByRole("navigation", { name: "Product", exact: true }).getByRole("link", {
      name: section === "studio-backgrounds" ? "Studio backgrounds" : new RegExp(section, "i"),
    });
    await expect(link).toHaveAttribute("href", `/#${section}`);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`#${section}$`));
    await expect(page.locator(`#${section} h2`)).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://studiocarai.com/");
  }
  await page.getByRole("navigation", { name: "Company footer links" }).getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/#about$/);
  await expect(page.locator("#about h2")).toHaveText("About StudioCar AI");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://studiocarai.com/");

  for (const route of ["/favicon.ico", "/icon.png", "/apple-icon.png", "/opengraph-image.png", "/robots.txt", "/sitemap.xml"]) {
    const response = await request.get(route);
    expect(response.ok(), route).toBe(true);
  }

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /");
  expect(robots).toContain("https://studiocarai.com/sitemap.xml");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("<loc>");

  const head = await page.locator("head").innerHTML();
  expect(head).not.toMatch(/localhost|vercel\.app|studiocar\.ai/);
});

test("serves declared favicon files to Google crawlers without authentication", async ({ request }) => {
  const googlebot = {
    "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  };
  const homepage = await request.get("/", { headers: googlebot });
  expect(homepage.status()).toBe(200);
  const document = await homepage.text();
  const head = document.slice(0, document.indexOf("</head>"));
  expect(head).toContain('rel="icon" href="/icon.png" type="image/png" sizes="192x192"');
  expect(head).toContain('rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16 32x32 48x48"');

  for (const userAgent of [googlebot["User-Agent"], "Googlebot-Image/1.0"]) {
    const icon = await request.get("/icon.png", { headers: { "User-Agent": userAgent } });
    expect(icon.status()).toBe(200);
    expect(icon.headers()["content-type"]).toContain("image/png");
    const image = await icon.body();
    expect(image.readUInt32BE(16)).toBe(192);
    expect(image.readUInt32BE(20)).toBe(192);

    const favicon = await request.get("/favicon.ico", { headers: { "User-Agent": userAgent } });
    expect(favicon.status()).toBe(200);
    expect(favicon.headers()["content-type"]).toMatch(/image\/(?:x-icon|vnd\.microsoft\.icon)/);
    expect((await favicon.body()).readUInt16LE(2)).toBe(1);
  }
});

test("keeps sign-in and authentication errors out of search indexes", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, nofollow/);
  await page.goto("/auth/error");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, nofollow/);
});
