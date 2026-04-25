/**
 * Registry file management for model pricing data.
 *
 * Handles reading and writing the canonical model price registry
 * (packages/shared/src/server/llm/modelPrices.ts or similar JSON source),
 * and provides typed access to registry entries.
 */

import * as fs from "fs";
import * as path from "path";

/** Relative path from project root to the model price registry JSON file. */
export const REGISTRY_PATH = path.resolve(
  __dirname,
  "../../../../packages/shared/src/server/llm/modelPrices.json"
);

/** Price expressed in USD per token (or per image/request for flat-rate models). */
export type PricePerToken = number | null;

export interface ModelPriceEntry {
  /** Canonical model identifier, e.g. "gpt-4o-2024-05-13" */
  modelName: string;
  /** Provider slug, e.g. "openai", "anthropic", "google" */
  provider: string;
  /** Match patterns used to identify this model in traces */
  matchPatterns: string[];
  /** Input / prompt token price in USD per token */
  inputPrice: PricePerToken;
  /** Output / completion token price in USD per token */
  outputPrice: PricePerToken;
  /** Cache read price in USD per token (optional) */
  cacheReadPrice?: PricePerToken;
  /** Cache write / creation price in USD per token (optional) */
  cacheWritePrice?: PricePerToken;
  /** ISO 8601 date string indicating when this entry was last updated */
  updatedAt: string;
  /** Source URL or reference for the pricing data */
  source?: string;
}

export type ModelPriceRegistry = ModelPriceEntry[];

/**
 * Load the model price registry from disk.
 * Returns an empty array if the file does not yet exist.
 */
export function loadRegistry(registryPath: string = REGISTRY_PATH): ModelPriceRegistry {
  if (!fs.existsSync(registryPath)) {
    return [];
  }
  const raw = fs.readFileSync(registryPath, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("Registry file must contain a JSON array.");
    }
    return parsed as ModelPriceRegistry;
  } catch (err) {
    throw new Error(
      `Failed to parse registry at ${registryPath}: ${(err as Error).message}`
    );
  }
}

/**
 * Persist the model price registry to disk.
 * Writes pretty-printed JSON so diffs remain readable.
 */
export function saveRegistry(
  registry: ModelPriceRegistry,
  registryPath: string = REGISTRY_PATH
): void {
  const dir = path.dirname(registryPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + "\n", "utf-8");
}

/**
 * Insert or update a model price entry in the registry.
 *
 * Matching is performed on (provider + modelName). If an existing entry is
 * found it is replaced in-place; otherwise the new entry is appended.
 *
 * @returns The mutated registry array.
 */
export function upsertEntry(
  registry: ModelPriceRegistry,
  entry: ModelPriceEntry
): ModelPriceRegistry {
  const idx = registry.findIndex(
    (e) =>
      e.provider === entry.provider &&
      e.modelName === entry.modelName
  );
  if (idx !== -1) {
    registry[idx] = { ...registry[idx], ...entry, updatedAt: entry.updatedAt };
  } else {
    registry.push(entry);
  }
  return registry;
}

/**
 * Look up an entry by provider and modelName.
 * Returns `undefined` when no match is found.
 */
export function findEntry(
  registry: ModelPriceRegistry,
  provider: string,
  modelName: string
): ModelPriceEntry | undefined {
  return registry.find(
    (e) => e.provider === provider && e.modelName === modelName
  );
}
