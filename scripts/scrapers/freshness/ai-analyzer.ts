/**
 * Claude Haiku AI analyzer for ambiguous freshness cases.
 * Classifies whether a job posting is still active, and optionally
 * extracts salary and certification data.
 */
import Anthropic from "@anthropic-ai/sdk";

export interface AIAnalysisResult {
  status: "active" | "closed";
  confidence: number;
  salary_raw?: string | null;
  certifications?: string[];
}

/**
 * Check if the Anthropic API key is available.
 * Allows the freshness checker to gracefully skip AI calls.
 */
export function isAIAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Analyze a job posting page with Claude Haiku to determine if it is still active.
 * Also extracts salary and certification data when available.
 *
 * Truncates page text to 3000 chars to keep costs low.
 */
export async function analyzeWithHaiku(
  pageText: string,
  jobTitle: string
): Promise<AIAnalysisResult> {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Analyze this job posting page for "${jobTitle}". Respond with JSON only.

1. Is this job posting still accepting applications? (active/closed)
2. If you see a salary amount (e.g., $45,000, $25/hr), extract it.
3. List any PA teaching certifications mentioned.

Page content (truncated):
${pageText.slice(0, 3000)}

Respond ONLY with JSON: {"status": "active"|"closed", "confidence": 0.0-1.0, "salary_raw": "string|null", "certifications": ["string"]}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  return JSON.parse(content.text);
}
