/**
 * Pure salary detection function.
 * Detects dollar amounts in job posting text and returns the matched snippet.
 * Vague terms like "competitive salary" do NOT count as salary mentions.
 */

export interface SalaryResult {
  mentioned: boolean;
  raw: string | null;
}

// Matches dollar amounts in various formats:
// $45,000  |  $25/hr  |  $50k  |  $45,000 - $65,000  |  $25.50/hour
// $50K-$70K  |  $45,000-65,000  |  $80,000/year
const SALARY_PATTERN =
  /\$\s?\d[\d,]*(?:\.\d{1,2})?(?:\s*[kK])?\s*(?:\/\s*(?:hr|hour|year|yr|annual|month|mo|wk|week|day))?\s*(?:[-\u2013\u2014]\s*\$?\s?\d[\d,]*(?:\.\d{1,2})?(?:\s*[kK])?(?:\s*\/\s*(?:hr|hour|year|yr|annual|month|mo|wk|week|day))?)?/g;

export function detectSalary(text: string | undefined | null): SalaryResult {
  if (!text) return { mentioned: false, raw: null };

  const matches = text.match(SALARY_PATTERN);
  if (!matches || matches.length === 0) {
    return { mentioned: false, raw: null };
  }

  // Take the longest match (most likely to be a complete salary range)
  const best = matches.reduce((a, b) => (a.length >= b.length ? a : b));
  return { mentioned: true, raw: best.trim() };
}
