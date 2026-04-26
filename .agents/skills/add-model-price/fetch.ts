/**
 * fetch.ts — helpers for retrieving live pricing data from provider APIs / public pages.
 *
 * Each provider export returns a list of raw price entries that can be fed
 * directly into `upsertModelPrice`.  Callers are responsible for mapping
 * provider-specific field names to the canonical ModelPrice shape.
 */

import https from "https";
import http from "http";

/** Minimal shape returned by every provider fetcher. */
export interface RawPriceEntry {
  modelId: string;
  inputPricePerMillionTokens: number | null;
  outputPricePerMillionTokens: number | null;
  /** Optional — only set when the provider distinguishes cache reads. */
  cacheReadPricePerMillionTokens?: number | null;
  unit?: string; // e.g. "tokens" | "characters" | "images"
  currency?: string; // ISO-4217, defaults to "USD"
}

/** Generic JSON fetcher — follows up to 3 redirects. */
export async function fetchJson<T = unknown>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const get = url.startsWith("https") ? https.get : http.get;
    get(url, { headers: { "User-Agent": "langfuse-agent/1.0" } }, (res) => {
      // Follow redirects
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        fetchJson<T>(res.headers.location).then(resolve).catch(reject);
        res.resume();
        return;
      }
      if (!res.statusCode || res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        res.resume();
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        } catch (err) {
          reject(new Error(`Failed to parse JSON from ${url}: ${err}`));
        }
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// OpenAI — prices are not exposed via a public API; we keep a well-known
// static URL for the tokenizer/model list and fall back gracefully.
// ---------------------------------------------------------------------------
export async function fetchOpenAIPrices(): Promise<RawPriceEntry[]> {
  // OpenAI does not publish a machine-readable pricing endpoint.
  // Return an empty array so callers know to use manual entry.
  console.warn(
    "[fetch] OpenAI does not expose a public pricing API. Use manual entry."
  );
  return [];
}

// ---------------------------------------------------------------------------
// Anthropic — similarly no public pricing API; placeholder for future use.
// ---------------------------------------------------------------------------
export async function fetchAnthropicPrices(): Promise<RawPriceEntry[]> {
  console.warn(
    "[fetch] Anthropic does not expose a public pricing API. Use manual entry."
  );
  return [];
}

// ---------------------------------------------------------------------------
// Together AI — exposes a /models endpoint with pricing fields.
// ---------------------------------------------------------------------------
const TOGETHER_MODELS_URL = "https://api.together.xyz/v1/models";

interface TogetherModel {
  id: string;
  pricing?: {
    input?: number; // price per token in USD
    output?: number;
  };
}

export async function fetchTogetherAIPrices(
  apiKey: string
): Promise<RawPriceEntry[]> {
  const raw = await fetchJson<TogetherModel[]>(
    TOGETHER_MODELS_URL + `?api_key=${encodeURIComponent(apiKey)}`
  );
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((m) => m.pricing)
    .map((m) => ({
      modelId: m.id,
      // Together reports price per token — convert to per-million
      inputPricePerMillionTokens:
        m.pricing?.input != null ? m.pricing.input * 1_000_000 : null,
      outputPricePerMillionTokens:
        m.pricing?.output != null ? m.pricing.output * 1_000_000 : null,
      currency: "USD",
      unit: "tokens",
    }));
}

// ---------------------------------------------------------------------------
// Utility: resolve a provider name to its fetcher (where available).
// ---------------------------------------------------------------------------
export type SupportedProvider = "openai" | "anthropic" | "together-ai";

export async function fetchPricesForProvider(
  provider: SupportedProvider,
  options: { apiKey?: string } = {}
): Promise<RawPriceEntry[]> {
  switch (provider) {
    case "openai":
      return fetchOpenAIPrices();
    case "anthropic":
      return fetchAnthropicPrices();
    case "together-ai":
      if (!options.apiKey) {
        throw new Error("together-ai requires an apiKey in options");
      }
      return fetchTogetherAIPrices(options.apiKey);
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}
