import { expect, test } from "@playwright/test";

test("home page renders with SEO basics", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/EzMath/);
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", /icon/);
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", /opengraph-image/);
  expect(errors).toEqual([]);
});

test("tests hub lists exams", async ({ page }) => {
  await page.goto("/tests?exam=EYESH");
  await expect(page.getByRole("heading", { name: "ЭЕШ шалгалтууд" })).toBeVisible();
});

test("robots.txt and sitemap.xml are served", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Disallow: /dashboard");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain("/tests/");
});
