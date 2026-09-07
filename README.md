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
# Clear world and progress, keeping character names and password logins.
npm run data:reset -- --scope world --confirm RESET
```

These commands are strictly local; they have no remote mode. They preserve schema and API-key files. Bundled world descriptions have been removed. After a world reset, logging in generates a fresh origin using the API. The same seed and world version still produce the same numerical world. A world reset clears regional/cell packages, visits, claims, badges and progress, returns existing characters to origin, and preserves their names/passwords. An all reset also removes those identities and sessions. The one-time 0002 migration performs the user-requested world reset on existing installations.

The root key file is read only by `setup:local`, which writes ignored `.dev.vars`. Never commit either file. Production secrets are configured through Sites, not the browser or hosting manifest.

## Generation

1. `lib/fields.ts` computes 33 distinct fields, including exact-zero feature absence and independently shaped spatial patterns. `lib/world.ts` resolves topology, symmetric exits, regions, events, and protected-origin overrides. See the [field catalog and distribution audit](docs/world-fields.md).
2. Missing shared regional entities are named once and persisted.
3. Pass 1 translates two baseline fields and up to four present features into short concrete details.
4. Pass 2 writes a usually 25–55-word scene (80-word maximum), plus exactly one short description for each exit. Connected neighbors provide continuity context only; their titles, contents, inhabitants, and events must not appear in the current scene or its exits. The UI lists every exit below the paragraph.
5. A future image-input package is stored. No image API is called.

Each stage uses a durable lease and saves its validated output independently. A failed scene pass reuses completed descriptive and regional stages. Generated cells are never rerolled on a normal revisit. Ordinary cells can have no special feature, event, or badge. The Dev view separates present features, baseline conditions, and absent features and explains each derivation.

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
- The event catalog has quiet cells, ordinary physical traps, rarer supernatural deaths, honors, elections, rare treasure, and portals. The origin and Manhattan radius 2 are safe.
- Portals make one transfer; destination encounter effects wait for a later entry, preventing automatic portal chains.
- Character history is paginated in groups of 25. Each character has a separate name/password login.
- The model and prompts are configurable; schema checks do not prove perfect narrative consistency. Canonical outputs remain saved even when a future prompt version changes.
- Optional WebMCP tools are registered when the browser supports them. No supported WebMCP validation context was available during this implementation; their live browser contract is not claimed as verified.

Regional naming and both text passes use [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) through the Responses API with strict Structured Outputs, low reasoning effort, and low verbosity. The actual response model is recorded with each generation. Image API calls remain disabled; textual visual description is fully encouraged.
