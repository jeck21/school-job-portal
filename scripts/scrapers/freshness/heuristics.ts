/**
 * Heuristic detection for closed/active job postings.
 * Uses regex patterns to classify page content before falling back to AI.
 */

/** Phrases that strongly indicate a posting is closed/filled */
const CLOSED_PATTERNS = [
  /position\s+(?:has\s+been\s+)?filled/i,
  /no\s+longer\s+accept(?:ing)?\s+applications/i,
  /posting\s+(?:has\s+been\s+)?closed/i,
  /this\s+(?:job|position)\s+(?:has\s+)?expired/i,
  /application\s+deadline\s+has\s+passed/i,
  /job\s+(?:has\s+been\s+)?removed/i,
  /this\s+listing\s+is\s+no\s+longer\s+available/i,
  /vacancy\s+(?:has\s+been\s+)?filled/i,
  /recruitment\s+(?:is\s+)?closed/i,
  /we\s+are\s+no\s+longer\s+hiring/i,
  /position\s+(?:is\s+)?unavailable/i,
  /job\s+posting\s+has\s+(?:been\s+)?archived/i,
];

/** Phrases that strongly indicate a posting is still active */
const ACTIVE_PATTERNS = [
  /apply\s+now/i,
  /submit\s+(?:your\s+)?application/i,
  /accepting\s+applications/i,
  /how\s+to\s+apply/i,
  /application\s+deadline\s*:\s*\d/i,
];

/**
 * Check page text for closed/active posting indicators.
 * Closed patterns take priority over active patterns.
 * Returns 'ambiguous' if neither match.
 */
export function checkClosedHeuristics(
  text: string
): "active" | "closed" | "ambiguous" {
  for (const pattern of CLOSED_PATTERNS) {
    if (pattern.test(text)) return "closed";
  }

  for (const pattern of ACTIVE_PATTERNS) {
    if (pattern.test(text)) return "active";
  }

  return "ambiguous";
}
