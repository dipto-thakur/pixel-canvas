// src/components/PixelCanvas/services/github-client.ts
//
// Browser-only GitHub contribution service.
// Talks ONLY to /api/github. Zero GraphQL/normalization logic —
// that lives in lib/github.ts + github-contributions.ts.

import {
  type ContributionMatrix,
  emptyMatrix,
} from "@/lib/github-contributions";

export interface FetchOptions {
  year?: number;
  signal?: AbortSignal;
}

interface GithubApiResponse {
  contributions?: ContributionMatrix;
  error?: string;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  data: ContributionMatrix;
  expires: number;
}

const cache = new Map<string, CacheEntry>();

const cacheKey = (year?: number) => `github:${year ?? "latest"}`;

export async function fetchGithubContributions(
  { year, signal }: FetchOptions = {},
): Promise<ContributionMatrix> {
  const key = cacheKey(year);
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && cached.expires > now) return cached.data;
  if (cached) cache.delete(key);

  const endpoint = year === undefined ? "/api/github" : `/api/github?year=${year}`;

  try {
    const response = await fetch(endpoint, {
      signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.warn(`[github-client] HTTP ${response.status} ${response.statusText}`);
      return emptyMatrix();
    }

    const json = (await response.json()) as GithubApiResponse;
    const matrix = json.contributions ?? emptyMatrix();

    cache.set(key, { data: matrix, expires: now + CACHE_TTL });
    return matrix;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    console.warn("[github-client] Fetch failed:", error);
    return emptyMatrix();
  }
}

export function clearGithubCache(year?: number): void {
  if (year === undefined) {
    cache.clear();
    return;
  }
  cache.delete(cacheKey(year));
}

export function warmGithubCache(data: ContributionMatrix, year?: number): void {
  cache.set(cacheKey(year), { data, expires: Date.now() + CACHE_TTL });
}

export type { ContributionMatrix } from "@/lib/github-contributions";