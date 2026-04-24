#!/usr/bin/env node
/**
 * CLI entry point for the add-model-price skill.
 * Allows adding or updating model prices in the registry via command line.
 *
 * Usage:
 *   npx ts-node cli.ts --provider openai --model gpt-4o --input 0.000005 --output 0.000015
 *   npx ts-node cli.ts --file ./batch-prices.json
 */

import { parseArgs } from "node:util";
import * as path from "path";
import * as fs from "fs";
import {
  upsertModelPrice,
  loadRegistry,
  saveRegistry,
  validateModelPrice,
  type ModelPriceEntry,
} from "./index";

const REGISTRY_PATH = path.resolve(__dirname, "../../model-prices.json");

function printUsage(): void {
  console.log(`
Usage:
  Single model:
    ts-node cli.ts --provider <name> --model <id> --input <price> --output <price> [--unit tokens|characters]

  Batch from JSON file:
    ts-node cli.ts --file <path-to-json>

Options:
  --provider   Provider name (e.g. openai, anthropic, google)
  --model      Model identifier (e.g. gpt-4o, claude-3-5-sonnet)
  --input      Price per token for input (prompt) tokens
  --output     Price per token for output (completion) tokens
  --unit       Token unit: "tokens" (default) or "characters"
  --file       Path to a JSON file containing an array of ModelPriceEntry objects
  --dry-run    Validate and preview changes without writing to registry
  --help       Show this help message
`);
}

async function runSingle(args: Record<string, string | boolean>): Promise<void> {
  const entry: ModelPriceEntry = {
    provider: String(args["provider"]),
    model: String(args["model"]),
    inputPricePerToken: parseFloat(String(args["input"])),
    outputPricePerToken: parseFloat(String(args["output"])),
    tokenUnit: (args["unit"] as "tokens" | "characters") ?? "tokens",
  };

  const errors = validateModelPrice(entry);
  if (errors.length > 0) {
    console.error("Validation errors:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  if (args["dry-run"]) {
    console.log("[dry-run] Would upsert:", JSON.stringify(entry, null, 2));
    return;
  }

  const registry = loadRegistry(REGISTRY_PATH);
  const updated = upsertModelPrice(registry, entry);
  saveRegistry(REGISTRY_PATH, updated);
  console.log(`✓ Upserted ${entry.provider}/${entry.model} into registry.`);
}

async function runBatch(
  filePath: string,
  dryRun: boolean
): Promise<void> {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolved, "utf-8");
  let entries: ModelPriceEntry[];
  try {
    entries = JSON.parse(raw);
  } catch {
    console.error("Failed to parse JSON file.");
    process.exit(1);
  }

  if (!Array.isArray(entries)) {
    console.error("Expected a JSON array of model price entries.");
    process.exit(1);
  }

  let hasErrors = false;
  for (const entry of entries) {
    const errors = validateModelPrice(entry);
    if (errors.length > 0) {
      console.error(`Errors for ${entry.provider}/${entry.model}:`);
      errors.forEach((e) => console.error(`  - ${e}`));
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error("Aborting due to validation errors.");
    process.exit(1);
  }

  if (dryRun) {
    console.log(`[dry-run] Would upsert ${entries.length} entries.`);
    entries.forEach((e) => console.log(`  - ${e.provider}/${e.model}`));
    return;
  }

  let registry = loadRegistry(REGISTRY_PATH);
  for (const entry of entries) {
    registry = upsertModelPrice(registry, entry);
  }
  saveRegistry(REGISTRY_PATH, registry);
  console.log(`✓ Upserted ${entries.length} model price entries into registry.`);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      provider: { type: "string" },
      model: { type: "string" },
      input: { type: "string" },
      output: { type: "string" },
      unit: { type: "string" },
      file: { type: "string" },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: false,
  });

  if (values["help"]) {
    printUsage();
    process.exit(0);
  }

  if (values["file"]) {
    await runBatch(String(values["file"]), Boolean(values["dry-run"]));
  } else if (values["provider"] && values["model"] && values["input"] && values["output"]) {
    await runSingle(values as Record<string, string | boolean>);
  } else {
    console.error("Missing required arguments. Use --help for usage information.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
