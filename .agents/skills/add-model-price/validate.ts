/**
 * Validation helpers for model price entries.
 * Provides detailed error messages and warnings for common mistakes.
 */

import type { ModelPrice } from "./index";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Known provider names for fuzzy-match warnings */
const KNOWN_PROVIDERS = [
  "openai",
  "anthropic",
  "google",
  "mistral",
  "cohere",
  "meta",
  "amazon",
  "azure",
  "groq",
  "together",
  "fireworks",
  "perplexity",
  "deepseek",
  "01-ai",
  "xai",
];

/** Reasonable upper bound for price per token (in USD). Above this is almost certainly a mistake. */
const MAX_PRICE_PER_TOKEN = 1; // $1 per token would be absurd

/** Reasonable lower bound — warn if suspiciously low but not zero */
const MIN_NONZERO_PRICE_PER_TOKEN = 1e-10;

/**
 * Validates a single ModelPrice entry and returns structured results.
 * Does NOT throw — callers decide how to handle errors/warnings.
 */
export function validateModelPriceEntry(entry: ModelPrice): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // --- Required fields ---
  if (!entry.modelName || entry.modelName.trim() === "") {
    errors.push("modelName is required and must not be empty.");
  }

  if (!entry.provider || entry.provider.trim() === "") {
    errors.push("provider is required and must not be empty.");
  } else {
    const normalised = entry.provider.toLowerCase();
    if (!KNOWN_PROVIDERS.includes(normalised)) {
      warnings.push(
        `Provider "${entry.provider}" is not in the known-providers list. ` +
          `Known providers: ${KNOWN_PROVIDERS.join(", ")}. ` +
          "If this is intentional, ignore this warning."
      );
    }
  }

  // --- Price sanity checks ---
  const priceFields: Array<keyof ModelPrice> = [
    "inputPrice",
    "outputPrice",
    "totalPrice",
  ];

  for (const field of priceFields) {
    const value = entry[field] as number | undefined;
    if (value === undefined || value === null) continue;

    if (typeof value !== "number" || isNaN(value)) {
      errors.push(`${field} must be a number, got: ${JSON.stringify(value)}`);
      continue;
    }

    if (value < 0) {
      errors.push(`${field} must not be negative, got: ${value}`);
    } else if (value > MAX_PRICE_PER_TOKEN) {
      errors.push(
        `${field} (${value}) exceeds the maximum sanity threshold of ${MAX_PRICE_PER_TOKEN} per token. ` +
          "Prices should be expressed per token, not per 1 K or 1 M tokens."
      );
    } else if (value > 0 && value < MIN_NONZERO_PRICE_PER_TOKEN) {
      warnings.push(
        `${field} (${value}) is extremely small. ` +
          "Verify the value is per-token and not already divided by an extra factor."
      );
    }
  }

  // Warn if neither inputPrice/outputPrice nor totalPrice is set
  const hasSplitPrices =
    entry.inputPrice !== undefined || entry.outputPrice !== undefined;
  const hasTotalPrice = entry.totalPrice !== undefined;

  if (!hasSplitPrices && !hasTotalPrice) {
    warnings.push(
      "No price fields are set (inputPrice, outputPrice, totalPrice). " +
        "At least one price field is expected."
    );
  }

  // --- Match pattern ---
  if (entry.matchPattern !== undefined && entry.matchPattern !== null) {
    try {
      new RegExp(entry.matchPattern);
    } catch (e) {
      errors.push(
        `matchPattern "${entry.matchPattern}" is not a valid regular expression: ${(e as Error).message}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Prints a ValidationResult to stderr (errors) / stdout (warnings).
 * Returns true if valid, false otherwise.
 */
export function reportValidation(
  result: ValidationResult,
  label = "entry"
): boolean {
  for (const w of result.warnings) {
    console.warn(`[WARN] ${label}: ${w}`);
  }
  for (const e of result.errors) {
    console.error(`[ERROR] ${label}: ${e}`);
  }
  return result.valid;
}
