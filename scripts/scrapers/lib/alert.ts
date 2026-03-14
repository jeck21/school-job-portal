/**
 * Post-scrape email alert function.
 * Sends email via Resend when scrape fails or partially fails.
 */
import { Resend } from "resend";

/**
 * Send an email alert for scrape failures.
 * Silently skips if RESEND_API_KEY or OPERATOR_EMAIL are not configured.
 */
export async function sendScrapeAlert(
  sourceName: string,
  status: string,
  errors: Array<{ message: string }>
): Promise<void> {
  // Only alert on failures
  if (status !== "failure" && status !== "partial_failure") {
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const operatorEmail = process.env.OPERATOR_EMAIL;

  if (!apiKey || !operatorEmail) {
    console.log(
      "[alert] Skipping email alert: RESEND_API_KEY or OPERATOR_EMAIL not configured"
    );
    return;
  }

  const errorRows = errors
    .map(
      (e) =>
        `<tr><td style="padding:4px 8px;border:1px solid #ddd;">${escapeHtml(e.message)}</td></tr>`
    )
    .join("\n");

  const html = `
    <h2>Scrape Alert: ${escapeHtml(sourceName)}</h2>
    <p><strong>Status:</strong> ${escapeHtml(status)}</p>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    ${
      errors.length > 0
        ? `
    <h3>Errors (${errors.length})</h3>
    <table style="border-collapse:collapse;width:100%;max-width:600px;">
      <tr><th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Message</th></tr>
      ${errorRows}
    </table>
    `
        : "<p>No error details available.</p>"
    }
  `.trim();

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "PA Educator Jobs <onboarding@resend.dev>",
      to: [operatorEmail],
      subject: `[Alert] Scrape ${status}: ${sourceName}`,
      html,
    });
    console.log(`[alert] Sent alert email for ${sourceName} (${status})`);
  } catch (err) {
    console.error(
      "[alert] Failed to send alert email:",
      (err as Error).message
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
