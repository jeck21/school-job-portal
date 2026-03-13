"use server";

import { Resend } from "resend";

type CoachingResult = {
  success: boolean;
  message: string;
};

export async function submitCoachingRequest(
  formData: FormData
): Promise<CoachingResult> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || "";
  const currentRole = (formData.get("currentRole") as string)?.trim() || "";
  const yearsExperience =
    (formData.get("yearsExperience") as string)?.trim() || "";
  const positionSought =
    (formData.get("positionSought") as string)?.trim() || "";
  const message = (formData.get("message") as string)?.trim() || "";

  if (!name || !email) {
    return { success: false, message: "Name and email are required." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const operatorEmail = process.env.OPERATOR_EMAIL;

  if (!apiKey || !operatorEmail) {
    console.error("Missing RESEND_API_KEY or OPERATOR_EMAIL env var");
    return {
      success: false,
      message:
        "Unable to send your request right now. Please try again later.",
    };
  }

  try {
    const resend = new Resend(apiKey);

    const optionalRows = [
      phone && `<tr><td style="padding:4px 8px;font-weight:600;">Phone</td><td style="padding:4px 8px;">${escapeHtml(phone)}</td></tr>`,
      currentRole && `<tr><td style="padding:4px 8px;font-weight:600;">Current Role</td><td style="padding:4px 8px;">${escapeHtml(currentRole)}</td></tr>`,
      yearsExperience && `<tr><td style="padding:4px 8px;font-weight:600;">Years of Experience</td><td style="padding:4px 8px;">${escapeHtml(yearsExperience)}</td></tr>`,
      positionSought && `<tr><td style="padding:4px 8px;font-weight:600;">Position Sought</td><td style="padding:4px 8px;">${escapeHtml(positionSought)}</td></tr>`,
      message && `<tr><td style="padding:4px 8px;font-weight:600;">Message</td><td style="padding:4px 8px;">${escapeHtml(message)}</td></tr>`,
    ]
      .filter(Boolean)
      .join("\n");

    const html = `
      <h2>New Coaching Request</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:4px 8px;font-weight:600;">Name</td><td style="padding:4px 8px;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:600;">Email</td><td style="padding:4px 8px;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        ${optionalRows}
      </table>
    `.trim();

    await resend.emails.send({
      from: "PA Educator Jobs <onboarding@resend.dev>",
      to: [operatorEmail],
      subject: `Coaching Request from ${name}`,
      replyTo: email,
      html,
    });

    return {
      success: true,
      message: "Thanks! I'll be in touch within 48 hours.",
    };
  } catch (error) {
    console.error("Failed to send coaching email:", error);
    return {
      success: false,
      message:
        "Unable to send your request right now. Please try again later.",
    };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
