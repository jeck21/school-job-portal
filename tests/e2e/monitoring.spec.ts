import { test } from "@playwright/test";

test.describe("Admin Monitoring Dashboard", () => {
  // INFRA-03 stubs — will be implemented by plan 09-03
  test.fixme("loads /admin/monitoring for admin user", async () => {});
  test.fixme("shows scrape timeline with status dots", async () => {});
  test.fixme("shows job count trend chart", async () => {});
  test.fixme("shows error log with expandable details", async () => {});
  test.fixme("redirects non-admin users away from /admin/monitoring", async () => {});
});
