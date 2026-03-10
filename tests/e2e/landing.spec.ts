import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("displays site name in page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/PA Educator Jobs/);
  });

  test("shows navigation links in header", async ({ page }) => {
    await page.goto("/");
    // Use the desktop nav (visible at 1280px viewport)
    const desktopNav = page.locator("header nav").first();
    await expect(desktopNav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(desktopNav.getByRole("link", { name: "Jobs" })).toBeVisible();
    await expect(
      desktopNav.getByRole("link", { name: "About" })
    ).toBeVisible();
    await expect(
      desktopNav.getByRole("link", { name: "For Schools" })
    ).toBeVisible();
  });

  test("renders hero section with CTA buttons", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /connecting the right educators/i,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Browse Jobs" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "For Schools" }).first()
    ).toBeVisible();
  });

  test("renders audience cards section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("For Educators")).toBeVisible();
    await expect(page.getByText("For Schools & Districts")).toBeVisible();
  });

  test("renders stats bar with placeholder values", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Active Listings")).toBeVisible();
    await expect(page.getByText("PA Sources")).toBeVisible();
    // "Districts" appears in both stats bar and audience cards,
    // so scope to the stats section
    const statsSection = page.locator("section").last();
    await expect(statsSection.getByText("Districts")).toBeVisible();
  });
});
