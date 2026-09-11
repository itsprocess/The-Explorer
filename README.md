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
- Options pause travel. Automatic challenges use the actual trait, item or standing. Failed checks cannot award achievement badges. Teleport Continue/Wait controls are UI, not lore; Wait allows inspection and markers, while attempted travel reopens the encounter.
- Travel totals count completed moves (teleports count once), with life/lifetime counters and a global all-character sum; geometric distance from origin remains separate. See [move counts](docs/MOVE-COUNTS.md).
- Personal markers and three minimap tones distinguish unexplored, others’ discoveries and your visits. Discoverer credits, relic records and occasional lasting traces make the world shared.
- Badges are unique achievements and open shareable image/story pages without coordinates. Death preserves permanent progression, defining trait and affiliation standings; single-use items follow their separate death-persistence rule. Give up is available on the profile.
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

### Encounter outcome guarantees

The AI receives `player_death` with the player explicitly identified as victim. Fatal history must begin with `{character_name} died` or `{character_name} was killed` and explain the cause; option labels describe attempts, not promised successes. Validation and resolution reject opponent-killing prose for a player death. Existing lethal encounters refresh their AI narration once when loaded under this contract, preserving terrain, images, assigned outcomes and recorded history.

Relics are world-wide first discoveries. Movement, teleport arrivals and option resolution atomically commit the unique cell claim with the character and visit. Later visitors receive the revisit narration and no relic count; pre-existing discovery history also blocks a fresh claim. The location credits only its earliest finder. Dev travel never writes these claims. Historical records and previously credited totals are retained.

Water/void tuning (September 9): inland basin candidate rates are 2.5x with unchanged 12–44 cell diameters and the existing altitude, erosion and exclusion masks. Void district/core scales are divided by sqrt(2), doubling spatial frequency per area; the cutoff is eased from 0.72 to 0.65 for greater coverage. Independent 3–9 cell void pockets are combined before the ocean mask. Overlap and masks determine actual coverage; these are recipe rates, not measured coverage ratios. Default seed: `keys-beneath-the-lanterns`.

Portal reach is sampled within a disk centered on departure with radius `max(50, 5 × distance from origin)`, rounded to tile coordinates. Cached portals refresh their destinations without regenerating prose or images; already-pending journeys retain their committed destination. No reset is required.

Constructed interiors omit regional groundcover from AI setting inputs and use architecture to interpret the floor. Natural caves and outdoor neighbor peeks retain their own groundcover. Raw noise values and traversal are unchanged. Interior setting caches use a separate revision; saved scenes/images are not automatically regenerated.

### History and community

History has its own authenticated tab; it is absent from personal and shared profile views. The history API enforces the signed-in character. Personally visited minimap cells open History filtered to that coordinate; other cells remain noninteractive. The Explorers tab pages through all characters and links to their public profiles. World statistics include total relics uncovered, summed from lifetime character totals.

Encounter narration uses required properties keyed by the engine's assigned outcome leaves, preventing a duplicated leaf from replacing another branch. Semantic validation runs before provider responses can be cached as complete, with one repair attempt for invalid prose. Occurrence text cache revision 7 bypasses previously cached malformed drafts; completed scenes and existing world progress are preserved. No generation or world reset is required for deployment.

### Encounter and barrier rebalance (September 9)

The current default seed is `keys-beneath-the-lanterns`. Each non-portal occurrence (challenge, option, gift, certain death and relic) has two independent candidate patterns instead of one, approximately doubling opportunities; overlaps and civilization boosts affect realized rates. Portal points are halved at baseline after accounting for the nine-cell local-maximum rule. Portal jump radius is `max(50, 5 × distance from origin)`.

Option encounters have a 5% portal gate on their bonus response; other option branches, including nested challenges, cannot independently introduce portals. Automatic challenge branches also use a 5% portal roll. Remaining outcomes use the other existing mechanisms. Standing-result chance doubles to `min(1, 2 × (0.15 + 0.7 × devoutness))`; point amounts are unchanged.

Severe-weather patches occur one-third as often, retaining their strength and size. Ocean, void, chasm and river noise layouts have twice the spatial frequency per area (scales divided by sqrt(2)); small-void patch spacing is divided by sqrt(2), while lake patterns are duplicated on independent channels to retain their sizes and minimum separation. This increases barrier frequency, not a promised exact doubled blocked-area percentage: masks and overlaps still apply, and river crossing relief remains separate. Migration 0031 performs the requested world/progress reset while preserving accounts, credentials, sessions and defining traits, and queues removal of old illustrations.

Underground can overlap civilization and Inside. Combined enclosures support dungeons, mines, crypts and other constructed subterranean spaces; they no longer force a natural cave. Off-ground poles suggest raised platforms at low intensity and context-appropriate treehouses, canopy walkways, suspended settlements or floating islands at high intensity.

Surreal is the 48th variable: a variation gradient for dream logic and impossible relationships, distinct from Psychedelic sensory distortion. It uses the same quiet background, rare spark recipe and distance escalation with independent channels. Runtime and noise-app defaults match; saved drafts receive Surreal when a free variable slot exists, preserving their edits. New generated prose and illustrations lean toward dark-fantasy adventure while respecting supplied light, weather, inhabitants, geography and outcomes. Existing saved places and the world seed remain unchanged.

### Current adventure economy

Four ordinary inventory types—Tools, Gear (weapons/armor/adventuring equipment), Consumables and Valuables—plus Keys. Every newly generated item is consumed on its first successful use. Unused items independently have a 20% chance of surviving death; this never grants extra uses. Seeded item rarity is 82% Common, 14% Rare, 4% Legendary. Checks match type and optionally minimum rarity; higher tiers qualify and the lowest sufficient carried tier is selected. Ordinary status rewards/checks are retired; the legacy representation remains for compatibility, with only one Death Protection charge generated as a separate blessing (1.5% of award rolls).

Options have two ordinary responses and a third gated by an item/key or sufficient affiliation standing. The server filters and validates that third response and consumes its item only when selected. Defining traits influence ordinary checks, never unlock the third. Missing requirements can lose opportunities, reputation or life; satisfying them yields a benefit. Successful options, reward claims and standing changes cannot be farmed; declining leaves the encounter available, and a missed automatic check may be revisited with its requirement. Automatic checks use only defining traits or affiliation standing; inventory and keys require an explicit choice. Cached automatic item checks are converted into optional interactions without resetting claims. Lasting traces come only from visible changes caused by explicit choices; automatic-event traces are not displayed. Item-check badge chances rise from 4% Common to 15% Rare and 40% Legendary; unrelated gifts do not award badges. Deaths remain history/count records and never badges. Both personal and public profiles include a collapsed Deaths archive, loaded on demand with paginated narratives and no coordinate fields.

A subset of option candidates instead produces a personal locked object or location, gated by a matching-or-better key. The explorer can inspect/mark its exterior and leave. Its contents and encounters do not resolve until unlocking; the key is consumed and the personal unlock survives death. No edge locks or global lock claims exist. Opening a lock grants an assigned reward. Dev unlocks stay inside dev state. Relic first-finder claims remain independently global.

There are exactly three world-wide identities in each of factions, kingdoms and religions. Each has a stable shared cache key; nine distinct name prefixes prevent name collisions. Regional appearances retain the same identity and standing. Indoor/underground prompt inputs omit weather severity; scene instructions disallow local outdoor weather. Migration 0033 resets progress for this economy and preserves accounts, password hashes, sessions and defining traits.
