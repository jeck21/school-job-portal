/**
 * Shared types for the scraper pipeline.
 * All source adapters produce ScrapedJob records via the SourceAdapter interface.
 */

export interface ScrapedJob {
  externalId: string;
  title: string;
  url: string;
  locationRaw: string;
  city?: string;
  state: string;
  zipCode?: string;
  schoolName: string;
  schoolType?: string;
  description?: string;
  subjectArea?: string;
  positionType?: string;
  certificates?: string[];
  deadline?: string;
  postedDate?: string;
}

export interface ScrapeError {
  message: string;
  category?: string;
  page?: number;
  timestamp: string;
}

export interface ScrapeResult {
  jobs: ScrapedJob[];
  errors: ScrapeError[];
  stats: {
    added: number;
    updated: number;
    skipped: number;
    failed: number;
  };
}

export interface SourceAdapter {
  readonly sourceSlug: string;
  scrape(): Promise<ScrapedJob[]>;
}
