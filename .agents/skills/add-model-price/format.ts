/**
 * format.ts
 * Utilities for formatting model price data for display and output.
 */

import type { ModelPrice } from "./index";

/** Column widths for tabular output */
const COL_WIDTHS = {
  model: 48,
  provider: 16,
  input: 16,
  output: 16,
  unit: 10,
};

/**
 * Format a price-per-token value as a human-readable USD string.
 * Displays as price per 1M tokens for readability.
 */
export function formatPricePerToken(
  pricePerToken: number | null | undefined
): string {
  if (pricePerToken == null) return "—";
  const perMillion = pricePerToken * 1_000_000;
  if (perMillion === 0) return "$0.00";
  if (perMillion < 0.001) return `$${perMillion.toExponential(2)}`;
  return `$${perMillion.toFixed(perMillion < 0.01 ? 4 : 2)}`;
}

/**
 * Format a single ModelPrice entry as a human-readable table row.
 */
export function formatModelRow(entry: ModelPrice): string {
  const model = truncate(entry.modelName, COL_WIDTHS.model);
  const provider = truncate(entry.provider ?? "(unknown)", COL_WIDTHS.provider);
  const input = formatPricePerToken(entry.inputPrice).padStart(
    COL_WIDTHS.input
  );
  const output = formatPricePerToken(entry.outputPrice).padStart(
    COL_WIDTHS.output
  );
  const unit = (entry.unit ?? "TOKENS").padEnd(COL_WIDTHS.unit);

  return `${model.padEnd(COL_WIDTHS.model)}  ${provider.padEnd(
    COL_WIDTHS.provider
  )}  ${input}  ${output}  ${unit}`;
}

/**
 * Print a formatted table header for model price listings.
 */
export function formatTableHeader(): string {
  const model = "Model".padEnd(COL_WIDTHS.model);
  const provider = "Provider".padEnd(COL_WIDTHS.provider);
  const input = "Input/1M tok".padStart(COL_WIDTHS.input);
  const output = "Output/1M tok".padStart(COL_WIDTHS.output);
  const unit = "Unit".padEnd(COL_WIDTHS.unit);

  const header = `${model}  ${provider}  ${input}  ${output}  ${unit}`;
  const separator = "-".repeat(header.length);

  return `${header}\n${separator}`;
}

/**
 * Format a list of ModelPrice entries as a printable table string.
 */
export function formatModelTable(entries: ModelPrice[]): string {
  if (entries.length === 0) return "(no entries)";

  const rows = entries.map(formatModelRow);
  return [formatTableHeader(), ...rows].join("\n");
}

/**
 * Format a diff summary between two versions of a model entry.
 * Returns a human-readable string describing what changed.
 */
export function formatDiff(
  previous: ModelPrice | null,
  next: ModelPrice
): string {
  if (!previous) {
    return [
      `+ Added: ${next.modelName} (${next.provider ?? "unknown provider"})`,
      `  Input:  ${formatPricePerToken(next.inputPrice)} / 1M tokens`,
      `  Output: ${formatPricePerToken(next.outputPrice)} / 1M tokens`,
    ].join("\n");
  }

  const lines: string[] = [
    `~ Updated: ${next.modelName} (${next.provider ?? "unknown provider"})`,
  ];

  if (previous.inputPrice !== next.inputPrice) {
    lines.push(
      `  Input:  ${formatPricePerToken(previous.inputPrice)} → ${formatPricePerToken(next.inputPrice)}`
    );
  }
  if (previous.outputPrice !== next.outputPrice) {
    lines.push(
      `  Output: ${formatPricePerToken(previous.outputPrice)} → ${formatPricePerToken(next.outputPrice)}`
    );
  }
  if (previous.unit !== next.unit) {
    lines.push(`  Unit:   ${previous.unit ?? "TOKENS"} → ${next.unit ?? "TOKENS"}`);
  }

  return lines.length === 1 ? `  (no changes detected)` : lines.join("\n");
}

/** Truncate a string to a maximum length, appending ellipsis if needed. */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}
