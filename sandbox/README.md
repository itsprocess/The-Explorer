# Noise app

Run `npm run sandbox` from `web/` and open http://127.0.0.1:4317. Build with `npm run build:sandbox`; output is `web/outputs/sandbox/` and is not committed. The app is independent of Sites, character accounts and AI providers.

The reviewed default is `reviewed-project.json`, identical to `../lib/fieldwork-baseline.json`. Runtime evaluation uses this app’s `model.ts`, so the approved package has the same meaning in preview and gameplay. A local draft lives in browser storage; changes do not automatically update the runtime default. Export and review changes before replacing both JSON defaults together.

The overall map combines terrain with a toggleable civilization overlay. Ocean/river/lake water stays blue; void and chasm are black. Traversal is inspectable separately. River crossing relief changes permission, not water identity.

Civilization includes living population, impact age, infrastructure and independent cultural variables. Affiliation fields represent enum-backed identities; AI supplies names. Inside and underground support connected enclosure. Off-ground patches support elevated settings.

Variation gradients: Whimsy, Chaos, Fantasticness, Unexpectedness, Interestingness, Absurdity, Opportunity, Danger, Vibrance, Psychedelic and Terrifying. Psychedelic and Terrifying match Whimsy’s recipe with independent channels. Existing drafts receive these two missing variables once without overwriting edits. Distance escalation is shared and bounded; zero stays zero.

Occurrence signals select actual gameplay events. Descriptive variation cannot create extra occurrences, change traversal or invent rewards. The schema/default and distance-escalation checks are in `../tests/sky-weather.test.ts`; these are focused non-generation tests.

Water/void tuning (September 9): inland basin candidate rates are 2.5x with unchanged 12–44 cell diameters and the existing altitude, erosion and exclusion masks. Void district/core scales are divided by sqrt(2), doubling spatial frequency per area; the cutoff is eased from 0.72 to 0.65 for greater coverage. Independent 3–9 cell void pockets are combined before the ocean mask. Overlap and masks determine actual coverage; these are recipe rates, not measured coverage ratios. Default seed: `keys-beneath-the-lanterns`.

### Encounter and barrier rebalance (September 9)

The current default seed is `keys-beneath-the-lanterns`. Each non-portal occurrence (challenge, option, gift, certain death and relic) has two independent candidate patterns instead of one, approximately doubling opportunities; overlaps and civilization boosts affect realized rates. Portal points are halved at baseline after accounting for the nine-cell local-maximum rule. Portal jump radius is `max(50, 5 × distance from origin)`.

Option encounters have a 5% portal gate on their bonus response; other option branches, including nested challenges, cannot independently introduce portals. Automatic challenge branches also use a 5% portal roll. Remaining outcomes use the other existing mechanisms. Standing-result chance doubles to `min(1, 2 × (0.15 + 0.7 × devoutness))`; point amounts are unchanged.

Severe-weather patches occur one-third as often, retaining their strength and size. Ocean, void, chasm and river noise layouts have twice the spatial frequency per area (scales divided by sqrt(2)); small-void patch spacing is divided by sqrt(2), while lake patterns are duplicated on independent channels to retain their sizes and minimum separation. This increases barrier frequency, not a promised exact doubled blocked-area percentage: masks and overlaps still apply, and river crossing relief remains separate. Migration 0031 performs the requested world/progress reset while preserving accounts, credentials, sessions and defining traits, and queues removal of old illustrations.

Underground can overlap civilization and Inside. Combined enclosures support dungeons, mines, crypts and other constructed subterranean spaces; they no longer force a natural cave. Off-ground poles suggest raised platforms at low intensity and context-appropriate treehouses, canopy walkways, suspended settlements or floating islands at high intensity.

Surreal is the 48th variable: a variation gradient for dream logic and impossible relationships, distinct from Psychedelic sensory distortion. It uses the same quiet background, rare spark recipe and distance escalation with independent channels. Runtime and noise-app defaults match; saved drafts receive Surreal when a free variable slot exists, preserving their edits. New generated prose and illustrations lean toward dark-fantasy adventure while respecting supplied light, weather, inhabitants, geography and outcomes. Existing saved places and the world seed remain unchanged.

### Current adventure economy

Four ordinary inventory types—Tools, Gear (weapons/armor/adventuring equipment), Consumables and Valuables—plus Keys. Every newly generated item is consumed on its first successful use. Unused items independently have a 20% chance of surviving death; this never grants extra uses. Seeded item rarity is 82% Common, 14% Rare, 4% Legendary. Checks match type and optionally minimum rarity; higher tiers qualify and the lowest sufficient carried tier is selected. Ordinary status rewards/checks are retired; the legacy representation remains for compatibility, with only one Death Protection charge generated as a separate blessing (1.5% of award rolls).

Options have two ordinary responses and a third gated by an item/key or sufficient affiliation standing. The server filters and validates that third response and consumes its item only when selected. Defining traits influence ordinary checks, never unlock the third. Missing requirements can lose opportunities, reputation or life; satisfying them yields a benefit. Successful options, reward claims and standing changes cannot be farmed; declining leaves the encounter available, and a missed automatic check may be revisited with its requirement. Successful automatic checks do not consume additional items on later visits. Item-check badge chances rise from 4% Common to 15% Rare and 40% Legendary; unrelated gifts do not award badges. Deaths remain history/count records and never badges.

A subset of option candidates instead produces a personal locked object or location, gated by a matching-or-better key. The explorer can inspect/mark its exterior and leave. Its contents and encounters do not resolve until unlocking; the key is consumed and the personal unlock survives death. No edge locks or global lock claims exist. Opening a lock grants an assigned reward. Dev unlocks stay inside dev state. Relic first-finder claims remain independently global.

There are exactly three world-wide identities in each of factions, kingdoms and religions. Each has a stable shared cache key; nine distinct name prefixes prevent name collisions. Regional appearances retain the same identity and standing. Indoor/underground prompt inputs omit weather severity; scene instructions disallow local outdoor weather. Migration 0033 resets progress for this economy and preserves accounts, password hashes, sessions and defining traits.

Current defaults slightly narrow Underground veins (0.44–0.56) and use 35% pocket candidates. Vibrance and Psychedelic quiet backgrounds cap at 10%, retaining their distance escalation and high-end sparks.
