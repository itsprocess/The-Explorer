# Token usage and efficient generation

The Dev tab reports actual provider-returned input, cached input, output, reasoning and total tokens for the current cell. Input cache and reasoning counts are subsets, not additions. Text and image requests, repairs, incomplete responses and reported failed-response usage are recorded independently in `generation_usage`. Unreported usage is unknown, not zero. Interrupted network responses can have unreported provider charges. Shared kingdom/faction/religion calls are shown separately and excluded from cell totals; identities remain generated once and reused. Reading a cached package creates no provider request or usage receipt.

## Generation

1. The app derives the full deterministic world data, then prepares a compact context locally at no token cost.
2. One Luna structured-output call interprets that context and writes the canonical scene, exits and applicable encounter branches.
3. Image generation uses the existing painted environment style, threat context, low quality, 1008×672 WebP settings. This is intentionally unchanged.

Only baseline ratings and present features enter the text prompt. Strengths use 0–100 values; app-layer calculations retain their original precision. Derivation recipes, absent fields, redundant flags, seed internals, transport destination and full neighboring rating catalogs are omitted. The scene still receives every exit, barrier, visible neighbor terrain, derived situation, active mechanical rule, applicable regional lore, and saved neighbors’ physical facts and reciprocal exit description. App outcomes and topology are unchanged.

The output schema includes only applicable event, badge and trait fields; the app restores unused fields to empty strings. Regional output cap: 600 tokens. Scene cap: 1800 tokens. A validation repair is bounded to one additional call and is included in accounting. Queued responses and finished stages stay reusable.

An offline 60-cell comparison with saved-neighbor context reduced mean text prompt+schema characters from about 131,325 to 6,500 (~95%). This compares both previous text passes against the combined pass. It is a reproducible character measurement (`scripts/audit-prompt-budget.ts`), not a tokenizer measurement, billing forecast or live prose-quality evaluation. It excludes image and shared-region requests.

Speculative generation is disabled: no neighbor, hover, focus or pending-teleport preloads. The old preload endpoint returns a cheap no-op for stale clients. Only an actual visit requests new text/art. Existing cached neighboring packages still provide continuity. Multiple active players still share the provider queue; cached packages and images are preserved. Image quality and style are unchanged.

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

## Foreground reliability update

The response schema requires an object with exactly the available cardinal exit keys. Event fields are short subjectless past-tense clauses; the app inserts character and conditional trait placeholders before validation/storage. This avoids rejecting a whole location because a model omitted a placeholder. Cached packages remain untouched. Remaining validation failures receive one bounded repair; raw internal errors stay out of both JSON and streamed player responses. Final scene diagnostics are available only through authenticated Dev.

Authentication completes before location generation; the authenticated game request then streams generation. A failed movement retry reuses its original action and idempotency key, instead of merely reloading the old tile. There is no reset, schema migration, seed change, model change or image setting change in this update.

Validation for foreground update: 53 tests passed. One actual Luna once-only encounter response passed the new schema/compiler/validator in 5.7 seconds, using 1,840 total tokens. No image was generated for this check. This single text-call timing is not an end-to-end exploration latency guarantee.

## Riverglass world and prose cleanup

The new seed is `the-explorer-riverglass-20260907`. Migration 0014 resets locations, history, claims, generation receipts and character world progress (including badges, traits and pending transport), preserving character IDs/names, credential hashes and sessions.

Trait cards omit the redundant generated description line. Trait descriptions requested for stored data must be natural language, never serialized enum labels. Encounter instructions require a specific physical incident and response, not commentary about events or history recording. Base death prose describes the physical cause only. Location death records hide item/status changes; private character history retains the complete lifecycle record for searching.
