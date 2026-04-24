/**
 * Skill: add-model-price
 *
 * Automates the process of adding new AI model pricing entries to the
 * Langfuse model registry. Fetches provider pricing data and generates
 * the appropriate model definition records.
 */

import * as fs from "fs";
import * as path from "path";

/** Supported token price units */
export type PriceUnit = "per_1k_tokens" | "per_1m_tokens" | "per_token";

/** A single model pricing entry */
export interface ModelPrice {
  /** Provider identifier, e.g. "openai", "anthropic", "google" */
  provider: string;
  /** Model name as used by the provider API */
  modelName: string;
  /** Optional regex match pattern for fuzzy model name matching */
  matchPattern?: string;
  /** Input (prompt) token price in USD */
  inputPrice: number;
  /** Output (completion) token price in USD */
  outputPrice: number;
  /** Unit for the prices above */
  unit: PriceUnit;
  /** ISO 8601 date when this pricing became effective */
  startDate?: string;
  /** Optional cached/context-window input price tier */
  cachedInputPrice?: number;
}

/** Normalise any price to a per-token USD value */
export function normaliseToPricePerToken(
  price: number,
  unit: PriceUnit
): number {
  switch (unit) {
    case "per_token":
      return price;
    case "per_1k_tokens":
      return price / 1_000;
    case "per_1m_tokens":
      return price / 1_000_000;
    default:
      throw new Error(`Unknown price unit: ${unit}`);
  }
}

/**
 * Load existing model prices from the registry JSON file.
 * Returns an empty array when the file does not yet exist.
 */
export function loadRegistry(registryPath: string): ModelPrice[] {
  if (!fs.existsSync(registryPath)) {
    return [];
  }
  const raw = fs.readFileSync(registryPath, "utf-8");
  return JSON.parse(raw) as ModelPrice[];
}

/**
 * Persist updated model prices back to the registry JSON file.
 * Entries are sorted by provider → modelName for deterministic diffs.
 */
export function saveRegistry(registryPath: string, entries: ModelPrice[]): void {
  const sorted = [...entries].sort((a, b) => {
    const providerCmp = a.provider.localeCompare(b.provider);
    if (providerCmp !== 0) return providerCmp;
    return a.modelName.localeCompare(b.modelName);
  });
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(registryPath, JSON.stringify(sorted, null, 2) + "\n", "utf-8");
}

/**
 * Upsert a model price entry into the registry.
 * If an entry with the same provider + modelName already exists it is
 * replaced; otherwise the new entry is appended.
 *
 * @returns `true` when an existing entry was updated, `false` when inserted.
 */
export function upsertModelPrice(
  registry: ModelPrice[],
  entry: ModelPrice
): boolean {
  const idx = registry.findIndex(
    (e) => e.provider === entry.provider && e.modelName === entry.modelName
  );
  if (idx !== -1) {
    registry[idx] = entry;
    return true;
  }
  registry.push(entry);
  return false;
}

/**
 * Validate that a ModelPrice object has all required fields and that
 * numeric prices are non-negative finite numbers.
 */
export function validateModelPrice(entry: ModelPrice): string[] {
  const errors: string[] = [];
  if (!entry.provider) errors.push("provider is required");
  if (!entry.modelName) errors.push("modelName is required");
  if (!Number.isFinite(entry.inputPrice) || entry.inputPrice < 0)
    errors.push("inputPrice must be a non-negative finite number");
  if (!Number.isFinite(entry.outputPrice) || entry.outputPrice < 0)
    errors.push("outputPrice must be a non-negative finite number");
  if (!entry.unit) errors.push("unit is required");
  return errors;
}
