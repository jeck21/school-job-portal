import { describe, it } from "vitest";

describe("Scrape Alert Email", () => {
  it.todo("sends email via Resend on failure status");
  it.todo("sends email via Resend on partial_failure status");
  it.todo("does not send email on success status");
  it.todo("silently skips when RESEND_API_KEY is not configured");
});
