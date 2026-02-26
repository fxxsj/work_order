import { test, expect } from "@playwright/test";

test("example page has title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/./);
});
