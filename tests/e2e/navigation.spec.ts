import { test, expect } from "@playwright/test";

// TODO: Enable once navigation and page routes are built (Plan 01-02)
test.describe("Navigation", () => {
  test.skip("navigates to Jobs page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Jobs" }).click();
    await expect(page).toHaveURL("/jobs");
  });

  test.skip("navigates to About page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL("/about");
  });

  test.skip("navigates to For Schools page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "For Schools" }).click();
    await expect(page).toHaveURL("/for-schools");
  });

  test.skip("shows Coming Soon on unbuilt pages", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByText("Coming Soon")).toBeVisible();
  });
});
