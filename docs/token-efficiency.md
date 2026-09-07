# Token usage and efficient generation

The Dev tab reports actual provider-returned input, cached input, output, reasoning and total tokens for the current cell. Input cache and reasoning counts are subsets, not additions. Text and image requests, repairs, incomplete responses and reported failed-response usage are recorded independently in `generation_usage`. Unreported usage is unknown, not zero. Interrupted network responses can have unreported provider charges. Shared kingdom/faction/religion calls are shown separately and excluded from cell totals; identities remain generated once and reused. Reading a cached package creates no provider request or usage receipt.

## Generation

1. The app derives the full deterministic world data, then prepares a compact context locally at no token cost.
2. One Luna structured-output call interprets that context and writes the canonical scene, exits and applicable encounter branches.
3. Image generation uses the existing painted environment style, threat context, low quality, 1008×672 WebP settings. This is intentionally unchanged.

Only baseline ratings and present features enter the text prompt. Strengths use 0–100 values; app-layer calculations retain their original precision. Derivation recipes, absent fields, redundant flags, seed internals, transport destination and full neighboring rating catalogs are omitted. The scene still receives every exit, barrier, visible neighbor terrain, derived situation, active mechanical rule, applicable regional lore, and saved neighbors’ physical facts and reciprocal exit description. App outcomes and topology are unchanged.

The output schema includes only applicable event, badge and trait fields; the app restores unused fields to empty strings. Regional output cap: 600 tokens. Scene cap: 1800 tokens. A validation repair is bounded to one additional call and is included in accounting. Queued responses and finished stages stay reusable.

An offline 60-cell comparison with saved-neighbor context reduced mean text prompt+schema characters from about 131,325 to 6,500 (~95%). This compares both previous text passes against the combined pass. It is a reproducible character measurement (`scripts/audit-prompt-budget.ts`), not a tokenizer measurement, billing forecast or live prose-quality evaluation. It excludes image and shared-region requests.

All immediate neighbors still generate concurrently and remain undiscovered. Speculative images still cost tokens even if never visited; reducing those calls would trade away the requested preloaded artwork. No additional image calls, quality changes or frontier breadth changes were introduced.

## Failure and recovery

Credit exhaustion opens a shared durable provider pause. Queued requests and subsequent preload requests fail promptly instead of issuing more provider calls. Cached cells/images remain available. Ordinary rate limits pause new provider calls for one minute. Already in-flight provider requests may finish.

Stream deadlines now cover waiting for headers and the entire body, even when heartbeat packets continue. Image downloads also have a bounded wait. The loading cover displays an error and Retry generation control; Dev and Profile can be reached on failure. Retrying a completed image reloads its saved object rather than creating a replacement.

After adding API credit, use **Retry generation** from the error panel or Dev. This clears the pause; it does not add credit or reset account limits. Retries are explicitly initiated and locally throttled. No automatic credit probes run.

## Full reset

Migration 0013 clears all app characters, password hashes, sessions, presence, history, claims, generated packages, provider jobs and token receipts. It leaves generation paused for the known exhausted-credit condition and disables legacy bootstrap. The seed stays unchanged. Existing image objects are retired by exact object-key receipts and removed idempotently on the next data request, including images from the same seed. Site access and the API key are preserved.

The local reset command also clears presence and usage and removes stored illustrations. Schema and API configuration survive.

## Validation

Unit tests cover missing/zero usage, subtotal arithmetic, quotas, compact context, endless streams and reset completeness. `scripts/smoke-efficiency.ts` exercises real local HTTP/auth/D1 for cached data, parallel quota failures, the Dev ledger and manual resume without making an OpenAI request. Live AI evaluation is deliberately deferred until credit is restored.

Usage fields follow the [OpenAI Responses API reference](https://developers.openai.com/api/reference/cli/resources/responses/methods/create).
