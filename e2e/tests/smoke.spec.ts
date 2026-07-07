import { expect, test } from "@playwright/test";

test("home responde e renderiza", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
});
