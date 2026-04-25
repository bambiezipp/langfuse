# Common Model Families & Naming Conventions

This reference documents common model families and their naming conventions to help
when adding new model prices to the registry.

## OpenAI

| Family | Pattern Examples | Notes |
|--------|-----------------|-------|
| GPT-4o | `gpt-4o`, `gpt-4o-2024-05-13`, `gpt-4o-mini` | Flagship multimodal model |
| GPT-4 | `gpt-4`, `gpt-4-turbo`, `gpt-4-0125-preview` | Legacy flagship |
| GPT-3.5 | `gpt-3.5-turbo`, `gpt-3.5-turbo-0125` | Cost-effective chat |
| o1 | `o1`, `o1-mini`, `o1-preview` | Reasoning models |
| o3 | `o3`, `o3-mini` | Next-gen reasoning |
| Embeddings | `text-embedding-3-small`, `text-embedding-3-large`, `text-embedding-ada-002` | Vector embeddings |
| Image | `dall-e-3`, `dall-e-2` | Image generation |
| Audio | `whisper-1`, `tts-1`, `tts-1-hd` | Speech models |

**Match pattern tip:** Use `gpt-4o-.*` to match all GPT-4o dated variants.

## Anthropic

| Family | Pattern Examples | Notes |
|--------|-----------------|-------|
| Claude 3.5 | `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022` | Latest generation |
| Claude 3 | `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307` | Previous gen |
| Claude 2 | `claude-2.1`, `claude-2.0` | Legacy |
| Claude Instant | `claude-instant-1.2` | Fast legacy |

**Match pattern tip:** Use `claude-3-5-sonnet-.*` to match all Sonnet 3.5 versions.

## Google / Vertex AI

| Family | Pattern Examples | Notes |
|--------|-----------------|-------|
| Gemini 1.5 | `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-1.5-flash-8b` | Multimodal |
| Gemini 1.0 | `gemini-1.0-pro`, `gemini-1.0-ultra` | Previous gen |
| Gemini 2.0 | `gemini-2.0-flash`, `gemini-2.0-pro` | Latest gen |
| PaLM | `text-bison`, `chat-bison` | Legacy |
| Embeddings | `text-embedding-004`, `textembedding-gecko` | Vector embeddings |

## AWS Bedrock

Bedrock uses provider-prefixed model IDs:

| Provider | Pattern Examples |
|----------|----------------|
| Anthropic | `anthropic.claude-3-5-sonnet-20241022-v2:0` |
| Amazon | `amazon.titan-text-express-v1`, `amazon.nova-pro-v1:0` |
| Meta | `meta.llama3-70b-instruct-v1:0` |
| Mistral | `mistral.mistral-large-2402-v1:0` |
| Cohere | `cohere.command-r-plus-v1:0` |

**Match pattern tip:** Bedrock IDs include version suffixes — match with `anthropic\.claude-3-5-sonnet-.*`.

## Meta / Llama

| Family | Pattern Examples | Notes |
|--------|-----------------|-------|
| Llama 3.1 | `llama-3.1-8b-instruct`, `llama-3.1-70b-instruct`, `llama-3.1-405b-instruct` | Open weights |
| Llama 3.2 | `llama-3.2-1b-instruct`, `llama-3.2-3b-instruct`, `llama-3.2-11b-vision-instruct` | Multimodal |
| Llama 3.3 | `llama-3.3-70b-instruct` | Latest |

## Mistral AI

| Family | Pattern Examples | Notes |
|--------|-----------------|-------|
| Mistral Large | `mistral-large-latest`, `mistral-large-2411` | Flagship |
| Mistral Small | `mistral-small-latest`, `mistral-small-2409` | Efficient |
| Codestral | `codestral-latest`, `codestral-2405` | Code-focused |
| Mixtral | `open-mixtral-8x7b`, `open-mixtral-8x22b` | Open MoE |
| Embeddings | `mistral-embed` | Vector embeddings |

## Cohere

| Family | Pattern Examples | Notes |
|--------|-----------------|-------|
| Command R | `command-r`, `command-r-plus`, `command-r-08-2024` | RAG-optimized |
| Command | `command`, `command-light`, `command-nightly` | Legacy |
| Embeddings | `embed-english-v3.0`, `embed-multilingual-v3.0` | Vector embeddings |
| Rerank | `rerank-english-v3.0`, `rerank-multilingual-v3.0` | Reranking |

## Price Field Conventions

| Field | Unit | Description |
|-------|------|-------------|
| `inputPrice` | USD per token | Cost per input/prompt token |
| `outputPrice` | USD per token | Cost per output/completion token |
| `totalPrice` | USD per token | Combined price (used when input/output not split) |
| `inputCachedPrice` | USD per token | Discounted price for cached input tokens |

## Token Pricing Examples

To convert published $/1M token prices to per-token:

```
$3.00 / 1,000,000 tokens = 0.000003 USD per token = 3e-6
$0.30 / 1,000,000 tokens = 0.0000003 USD per token = 3e-7
$15.00 / 1,000,000 tokens = 0.000015 USD per token = 1.5e-5
```

Use scientific notation in the registry for readability: `3e-6` instead of `0.000003`.
