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

`db:local` applies missing local migrations and can be rerun. Local records live in `.wrangler/state/v3/d1` on disk; production uses durable D1 storage. Normal server restarts preserve both.

Characters use globally unique, case-insensitive names and passwords. Names are normalized and limited to 2–40 ASCII letters, digits, spaces, hyphens, or underscores. Passwords are 8–128 characters, stored only as independently salted scrypt hashes (N=16384, r=8, p=5). Random session tokens are kept in HttpOnly, SameSite=Strict cookies (Secure on HTTPS); only their SHA-256 hashes are stored server-side. Login attempts are rate-limited. There is no password recovery yet.

The hosted Site remains owner-private behind Sites sign-in. Character login is separate. Existing pre-password names remain reserved: their original signed-in Sites owner can use Create with the same name and a password to secure them. The Dev tab still requires Sites sign-in.

## Development data

| Table | Stored data |
| --- | --- |
| packages | Generated cells, regional identities, rating prose, and scene packages |
| characters | Character identity, position, deaths, maximum distance, badges, consumed events |
| visits / claims | History and globally consumed events |
| character_credentials | Unique name keys and password hashes |
| character_sessions / auth_attempts | Hashed sessions and login throttling |
| server_settings | Bootstrap-generation policy |

`npm run data:status` shows local storage location and counts. To clear data, stop the dev server, run one of these in `web`, then restart it:

```powershell
# Clear characters, logins, history, and event claims; retain generated world.
npm run data:reset -- --scope characters --confirm RESET
# Clear both world and characters for a new development run.
npm run data:reset -- --scope all --confirm RESET
```

These commands are strictly local; they have no remote mode. They preserve schema and API-key files. A full reset disables bundled bootstrap packages so old locations cannot silently reappear; the next character creation generates a fresh origin using the API. The same seed still produces the same numerical world. Resetting characters also frees their names and resets once-ever event claims. Resetting the world includes characters to avoid histories pointing to erased canon.

The root key file is read only by `setup:local`, which writes ignored `.dev.vars`. Never commit either file. Production secrets are configured through Sites, not the browser or hosting manifest.

## Generation

1. `lib/world.ts` computes the 160-rating context, topology, edges, regions, features, and protected-origin overrides.
2. Missing shared regional entities are named once and persisted.
3. Pass 1 describes a selected set of applicable ratings, with all 160 supplied as context.
4. Pass 2 writes the scene using pass 1 plus the saved packages and numerical context of connected neighbors.
5. A future image-input package is stored. No image API is called.

Each stage uses a durable lease and saves its validated output independently. A failed scene pass reuses completed descriptive and regional stages. Generated cells are never rerolled on a normal revisit. The initial origin and eastern neighbor are included as server-only bootstrap packages so deployment preserves the real API-generated canon from the first local run.

The Dev tab shows exact prompts, results, and internal ratings. Normal exploration and shareable cell/profile pages receive curated public data. Cardinal controls appear only for connected cells and disappear on death; the server enforces these same movement rules. The initial Site is owner-private; before opening it to a wider audience, add an owner-specific workshop permission and production generation spending/rate limits.

## Validation

```powershell
npm test
npm run typecheck
npm run build
```

`npm run smoke:local` creates a test character and performs real billable generation if its fixture cells are missing. It checks unique names, password login, session cookies, logout, cross-character authorization, origin safety, both text stages, connected-neighbor context, idempotent moves, and omission of passwords/private ratings from public responses. It writes the inspected cell package to ignored `outputs/example-cell-package.json`. `node scripts/test-reset.mjs` checks resets using isolated storage under ignored `outputs/reset-test-db`.

Unit tests cover deterministic and bounded ratings, origin protection, reciprocal edges at negative/large coordinates, spatial coherence, prompt completeness, death badge deduplication, repeat modes, character separation, and hostile badges.

## First-edition limits

- Coordinates are supported to ±1 billion on each axis, rather than claiming arbitrary-precision infinity.
- The connected backbone is a regular corridor lattice; optional rooms use noise. Recipes are an initial calibration, not a completed landscape simulation.
- Weather is static. Rivers are shaped bands, not a physical drainage simulation.
- The initial event catalog has quiet cells, five recurring death methods, honors, elections, rare treasure, and portals. The origin and Manhattan radius 2 are safe.
- Portals make one transfer; destination encounter effects wait for a later entry, preventing automatic portal chains.
- Character history is paginated in groups of 25. Each character has a separate name/password login.
- The model and prompts are configurable; schema checks do not prove perfect narrative consistency. Canonical outputs remain saved even when a future prompt version changes.
- Optional WebMCP tools are registered when the browser supports them. No supported WebMCP validation context was available during this implementation; their live browser contract is not claimed as verified.

OpenAI text requests use the [Responses API with Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). The initial configurable model is [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini).
