/**
 * PAeducator.net API response types.
 * Based on verified API responses from https://www.paeducator.net/api/
 */

/** Response from POST /api/search/jobs — array of job IDs */
export type PAeducatorSearchResponse = number[];

/** Response from GET /api/job/{id} — full job detail */
export interface PAeducatorJobDetail {
  id: number;
  jobTitle: string;
  county: string;
  employmentType: string;
  description: string;
  postedDttm: string;
  applicationDeadlineDate: string;
  organization: {
    name: string;
    city: string;
    zip: string;
    url: string;
    intermediateUnit_Id: string;
  } | null;
  certifications: Array<{
    name: string;
    certificationType: string;
  }> | null;
}
