import { BAGS_API_BASE_URL, type BagsHackathonListResponse } from "@/lib/bags/types";

const DEFAULT_RETRIES = 3;
const DEFAULT_BACKOFF_MS = 400;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = DEFAULT_RETRIES): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "pitchr-ingestion/1.0",
          accept: "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        return response;
      }

      if (response.status >= 500 || response.status === 429) {
        await sleep(DEFAULT_BACKOFF_MS * attempt);
        continue;
      }

      throw new Error(`Non-retryable response (${response.status}) for ${url}`);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(DEFAULT_BACKOFF_MS * attempt);
      }
    }
  }

  throw new Error(`Failed to fetch ${url}: ${String(lastError)}`);
}

export async function fetchHackathonListPage(page: number): Promise<BagsHackathonListResponse> {
  const url = `${BAGS_API_BASE_URL}/hackathon/list?page=${page}`;
  const response = await fetchWithRetry(url);
  const body = (await response.json()) as BagsHackathonListResponse;

  if (!body?.success) {
    throw new Error(`Bags list endpoint returned unsuccessful payload for page ${page}`);
  }

  return body;
}
