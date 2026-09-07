# The Explorer — text edition

A working Sites/Vinext application with deterministic world generation, two real OpenAI text passes, persistent regional identities, characters, and encounter history. Image generation is disabled.

## Run locally

Requirements: Node 22.13+ and the root workspace `.env.local` containing `OPENAI_API_KEY`. Optional `OPENAI_MODEL` and `WORLD_SEED` override the defaults.

```powershell
cd web
npm ci
npm run setup:local
npm run db:local
npm run dev
```

`db:local` initializes a fresh local database; do not rerun the initial SQL against an already initialized database. Later schema changes use new Drizzle migrations. Local records live in `.wrangler/state/v3/d1` on disk. The dev sign-in link uses the Sites local identity. Production uses ChatGPT sign-in and durable D1 storage.

The root key file is read only by `setup:local`, which writes ignored `.dev.vars`. Never commit either file. Production secrets are configured through Sites, not the browser or hosting manifest.

## Generation

1. `lib/world.ts` computes the 160-rating context, topology, edges, regions, features, and protected-origin overrides.
2. Missing shared regional entities are named once and persisted.
3. Pass 1 describes a selected set of applicable ratings, with all 160 supplied as context.
4. Pass 2 writes the scene using pass 1 plus the saved packages and numerical context of connected neighbors.
5. A future image-input package is stored. No image API is called.

Each stage uses a durable lease and saves its validated output independently. A failed scene pass reuses completed descriptive and regional stages. Generated cells are never rerolled on a normal revisit. The initial origin and eastern neighbor are included as server-only bootstrap packages so deployment preserves the real API-generated canon from the first local run.

The cog icon opens the signed-in generation workshop. It shows exact prompts, results, and internal ratings. Normal exploration and shareable cell/profile pages receive curated public data. The initial Site is owner-private; before opening it to a wider audience, add an owner-specific workshop permission and production generation spending/rate limits.

## Validation

```powershell
npm test
npm run typecheck
npm run build
```

`npm run smoke:local` performs real billable generation if its fixture cells are missing, using the local sign-in flow. It checks origin creation, both text stages, connected-neighbor context, idempotent requests, and omission of private ratings from public responses. It writes the inspected cell package to ignored `outputs/example-cell-package.json`.

Unit tests cover deterministic and bounded ratings, origin protection, reciprocal edges at negative/large coordinates, spatial coherence, prompt completeness, death badge deduplication, repeat modes, character separation, and hostile badges.

## First-edition limits

- Coordinates are supported to ±1 billion on each axis, rather than claiming arbitrary-precision infinity.
- The connected backbone is a regular corridor lattice; optional rooms use noise. Recipes are an initial calibration, not a completed landscape simulation.
- Weather is static. Rivers are shaped bands, not a physical drainage simulation.
- The initial event catalog has quiet cells, five recurring death methods, honors, elections, rare treasure, and portals. The origin and Manhattan radius 2 are safe.
- Portals make one transfer; destination encounter effects wait for a later entry, preventing automatic portal chains.
- Character history is paginated in groups of 25. Accounts currently support up to 30 characters.
- The model and prompts are configurable; schema checks do not prove perfect narrative consistency. Canonical outputs remain saved even when a future prompt version changes.
- Optional WebMCP tools are registered when the browser supports them. No supported WebMCP validation context was available during this implementation; their live browser contract is not claimed as verified.

OpenAI text requests use the [Responses API with Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). The initial configurable model is [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini).
