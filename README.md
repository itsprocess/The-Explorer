# The Explorer

A shared procedural world with deterministic terrain and encounters, AI-authored locations, asynchronous illustrations, and persistent characters. [Play the current Sites deployment](https://the-explorer.steve402319.chatgpt.site/).

## Active source and runtime

This `web/` checkout is the source repository. The game runs as a Sites Cloudflare Worker with D1 and R2. `app/` contains UI/routes, `lib/` the game engine, `db/schema.ts` the schema, and `drizzle/` migrations. GitHub source lives on `source-integration`; Sites uses its own main branch. Follow [Edit and publish](docs/EDIT-AND-PUBLISH.md).

GoDaddy, cPanel, portable Node packaging, `runtime/`, `app.js`, and `outputs/github-deployment/` are historical artifacts. Do not rebuild, synchronize or publish them.

## Local game

From this directory, with Node 22.13+:

```sh
npm ci
npm run setup:local
npm run db:local
npm run dev
```

Local setup reads the parent workspace `.env.local` and writes ignored `.dev.vars`. Supply `OPENAI_API_KEY`; optional `ADMIN_EMAIL`, `DEV_PASSWORD`, `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL` and `WORLD_SEED` override defaults. Provider and seed fallbacks come from `explorer.config.json`. Production variables remain in Sites, separately configured. Never commit secrets or generated data.

Local D1/R2 data persists under `.wrangler/state`. Review unapplied migrations before running `db:local` against valuable local data: historical migrations include explicitly authorized resets. No migrations or resets run merely by building.

Character credentials use salted scrypt hashes and hashed session tokens in HttpOnly cookies. The permanent defining trait is selected at creation. Sites audience access is separate from character login. Dev controls require owner identity plus a secondary password unlock for the current character login session.

## Noise app and default package

```sh
npm run sandbox
npm run build:sandbox
```

The standalone noise app runs at `http://127.0.0.1:4317`; its build is in ignored `outputs/sandbox/`. It requires no AI key and performs no paid generation. See [noise app guide](sandbox/README.md).

`lib/fieldwork-baseline.json` and `sandbox/reviewed-project.json` are identical approved defaults. Both use `sandbox/model.ts`. Browser draft edits remain local until explicitly reviewed/imported into source; exporting a draft does not change production.

The stack contains biome, civilization, variation and occurrence fields. River identity and crossing permission are separate. Civilization follows traversibility, with current population and historical impact defining its footprint. Variation includes Whimsy, Chaos, Fantasticness, Unexpectedness, Interestingness, Absurdity, Opportunity, Danger, Vibrance, Psychedelic and Terrifying. Quiet fractal backgrounds and rare sparks escalate with distance. Off-ground and weather severity also escalate. Atmosphere never invents mechanical encounters or deaths.

## Game behavior

- AI compiles variables into a cohesive setting; peeks expose terrain, infrastructure and enclosure. Directional transitions preserve neighboring geometry.
- Text and calculations gate travel; images load asynchronously. Saved images are reused. Only unlocked Dev controls can force regeneration.
- Options pause travel. Automatic challenges use the actual trait, possession, status or standing. Failed checks cannot award achievement badges. Teleport Continue/Wait controls are UI, not lore; Wait allows inspection and markers, while attempted travel reopens the encounter.
- Travel totals count completed moves (teleports count once), with life/lifetime counters and a global all-character sum; geometric distance from origin remains separate. See [move counts](docs/MOVE-COUNTS.md).
- Personal markers and three minimap tones distinguish unexplored, others’ discoveries and your visits. Discoverer credits, relic records and occasional lasting traces make the world shared.
- Badges are unique achievements and open shareable image/story pages without coordinates. Death preserves permanent progression, defining trait and affiliation standings; temporary possessions/statuses follow their lifetime rules. Give up is available on the profile.
- Dev travel remains isolated until Return to normal; it does not discover locations or advance the real run.
- Origin is a safe starting/return sanctuary. A sealed origin has four teleporter exits.

## Validation and maintenance

```sh
npm run typecheck
npx tsx --test tests/sky-weather.test.ts tests/token-economy.test.ts tests/dev-unlock.test.ts tests/river-identity.test.ts tests/challenge-success.test.ts tests/badge-sharing.test.ts
npm run build
npm run build:sandbox
```

These focused checks do not invoke AI. Do not run paid generation or broad procedural sampling without authorization. Generated content remains cached across prompt updates. No reset is part of normal maintenance, building or publishing. A specifically requested wipe follows the owner’s documented scope and seed policy.

Current implementation notes: [token economy](docs/TOKEN-ECONOMY.md), [Dev unlock and Wait](docs/DEV-UNLOCK.md), [river identity](docs/RIVER-IDENTITY.md), [challenge rewards](docs/CHALLENGE-REWARDS.md), [badge sharing](docs/BADGE-SHARING.md), [variation extensions](docs/VARIATION-EXTENSIONS.md). Older dated design notes are historical and may describe superseded seeds or mechanics.
