import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("navigates to Jobs page via nav link", async ({ page }) => {
    await page.goto("/");
    // Use the first visible nav (desktop at 1280px)
    await page.locator("header nav").first().getByRole("link", { name: "Jobs" }).click();
    await expect(page).toHaveURL("/jobs");
    await expect(
      page.getByRole("heading", { name: "Job Listings" })
    ).toBeVisible();
  });

  test("navigates to About page and shows Coming Soon", async ({ page }) => {
    await page.goto("/");
    await page
      .locator("header nav")
      .first()
      .getByRole("link", { name: "About" })
      .click();
    await expect(page).toHaveURL("/about");
    await expect(page.getByRole("heading", { name: "About" })).toBeVisible();
    await expect(page.getByText("coming soon", { exact: false })).toBeVisible();
  });

  test("navigates to For Schools page and shows Coming Soon", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .locator("header nav")
      .first()
      .getByRole("link", { name: "For Schools" })
      .click();
    await expect(page).toHaveURL("/for-schools");
    await expect(
      page.getByRole("heading", { name: /For Schools/i })
    ).toBeVisible();
    await expect(page.getByText("Coming soon", { exact: false })).toBeVisible();
  });

  test("Browse Jobs CTA navigates to /jobs", async ({ page }) => {
    await page.goto("/");
    // Click the hero Browse Jobs link (inside main content)
    await page.locator("main section").first().getByRole("link", { name: "Browse Jobs" }).click();
    await expect(page).toHaveURL("/jobs");
  });
});
