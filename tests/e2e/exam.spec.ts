import { expect, test, type Page } from "@playwright/test";

const TEST_ID = "sat-math-01";
const overlay = (page: Page) => page.getByRole("dialog", { name: /Шалгалт|шалгалт/ });

async function monitored(page: Page) {
  await page.context().addCookies([{ name: "e2e-monitored", value: "1", url: "http://localhost:3100" }]);
}

async function answerAndFinish(page: Page) {
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: "Дуусгах", exact: true }).click();
  await page.getByRole("button", { name: "Шалгалт дуусгах", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/tests/${TEST_ID}/result`));
}

test("a student outside any school or class starts without fullscreen or monitoring", async ({ page }) => {
  await page.goto(`/tests/${TEST_ID}/take`);
  await expect(overlay(page)).toContainText("Хариултууд автоматаар хадгалагдана");
  await page.getByRole("button", { name: "Шалгалт эхлэх" }).click();
  await expect(overlay(page)).toBeHidden();
  expect(await page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  // Leaving the tab is not reported for unmonitored students.
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.getByText("багшид харагдахаар тэмдэглэгдлээ")).toHaveCount(0);
  await answerAndFinish(page);
});

test("a school/class student enters fullscreen, can pause by leaving it, and resume", async ({ page }) => {
  await monitored(page);
  await page.goto(`/tests/${TEST_ID}/take`);
  await page.getByRole("button", { name: "Full screen эхлэх" }).click();
  await expect(overlay(page)).toBeHidden();
  expect(await page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);

  await page.evaluate(() => document.exitFullscreen());
  await expect(overlay(page)).toContainText("Шалгалт түр зогслоо");
  await page.getByRole("button", { name: "Full screen үргэлжлүүлэх" }).click();
  await expect(overlay(page)).toBeHidden();
  await answerAndFinish(page);
});

test("the exam still starts when the browser refuses fullscreen", async ({ page }) => {
  await monitored(page);
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () => Promise.reject(new TypeError("Permissions check failed"));
  });
  await page.goto(`/tests/${TEST_ID}/take`);
  await page.getByRole("button", { name: "Full screen эхлэх" }).click();
  await expect(overlay(page)).toBeHidden();
  await answerAndFinish(page);
});

test("a reload restores the session behind the start overlay", async ({ page }) => {
  await page.goto(`/tests/${TEST_ID}/take`);
  await page.getByRole("button", { name: "Шалгалт эхлэх" }).click();
  await page.getByRole("radio").first().click();
  await page.reload();
  await expect(page.getByText("Өмнөх оролдлогыг сэргээж үргэлжлүүллээ.")).toBeVisible();
  await page.getByRole("button", { name: "Шалгалт эхлэх" }).click();
  await expect(overlay(page)).toBeHidden();
  await expect(page.getByRole("radio").first()).toHaveAttribute("aria-checked", "true");
});
