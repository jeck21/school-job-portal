/**
 * PAREAP-specific types and constants.
 */

export interface PareapListingRow {
  externalId: string;
  positionType: string;
  jobTitle: string;
  certificate: string;
  schoolName: string;
  location: string;
  date: string;
  detailUrl: string;
}

export interface PareapCategory {
  name: string;
  srch: string;
}

export const PAREAP_BASE_URL = "https://www.pareap.net";

export const PAREAP_CATEGORIES: readonly PareapCategory[] = [
  { name: "Teaching", srch: "100" },
  { name: "Instructional Support", srch: "200" },
  { name: "School Administrative", srch: "300" },
  { name: "Support Services", srch: "400" },
] as const;
