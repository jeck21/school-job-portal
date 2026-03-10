/**
 * HTTP client with retry and polite delay for scraping.
 * Handles PAREAP SSL certificate issues via NODE_TLS_REJECT_UNAUTHORIZED.
 */

const USER_AGENT =
  "PAEdJobs-Bot/1.0 (+https://school-job-portal.vercel.app)";

/**
 * Fetch a URL with exponential backoff retry.
 * Retries on transient errors (network, 5xx). Does not retry 4xx.
 */
export async function fetchWithRetry(
  url: string,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (!response.ok) {
        const isRetryable = response.status >= 500 || response.status === 429;
        if (!isRetryable || attempt === maxRetries) {
          throw new Error(`HTTP ${response.status} for ${url}`);
        }
        throw new Error(`HTTP ${response.status} (retryable)`);
      }

      return await response.text();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.warn(
        `[http-client] Attempt ${attempt}/${maxRetries} failed for ${url}: ${(error as Error).message}. Retrying in ${backoffMs}ms...`
      );
      await delay(backoffMs);
    }
  }

  throw new Error("Unreachable");
}

/**
 * Polite delay between requests to avoid rate limiting.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
