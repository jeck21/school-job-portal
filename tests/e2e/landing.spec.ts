import { test, expect } from "@playwright/test";

// TODO: Enable once landing page is fully built (Plan 01-02)
test.describe("Landing Page", () => {
  test.skip("displays site name in page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/PA Educator Jobs/);
  });

  test.skip("shows navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Jobs" })).toBeVisible();
    await expect(page.getByRole("link", { name: "About" })).toBeVisible();
    await expect(page.getByRole("link", { name: "For Schools" })).toBeVisible();
  });

  test.skip("renders hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("PA Educator Jobs")).toBeVisible();
  });
});
