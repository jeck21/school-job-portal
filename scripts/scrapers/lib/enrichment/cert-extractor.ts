/**
 * Pure certification extraction function.
 * Extracts PDE certification areas mentioned in job posting text.
 * Returns canonical PDE names. Skips short names (< 4 chars) to avoid noise.
 */
import { PDE_CERT_AREAS } from "./pde-cert-taxonomy";

export function extractCertifications(
  text: string | undefined | null
): string[] {
  if (!text) return [];

  const found = new Set<string>();

  for (const cert of PDE_CERT_AREAS) {
    const names = [cert.name, ...cert.aliases];
    for (const name of names) {
      if (name.length < 4) continue; // Skip very short names (PE, ASL etc -- matched via longer aliases)

      // Escape regex special characters in the name
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");

      if (regex.test(text)) {
        found.add(cert.name); // Always store canonical name
        break; // Don't match multiple aliases for same cert
      }
    }
  }

  return Array.from(found);
}
