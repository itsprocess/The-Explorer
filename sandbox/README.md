# Noise app

Run `npm run sandbox` from `web/` and open http://127.0.0.1:4317. Build with `npm run build:sandbox`; output is `web/outputs/sandbox/` and is not committed. The app is independent of Sites, character accounts and AI providers.

The reviewed default is `reviewed-project.json`, identical to `../lib/fieldwork-baseline.json`. Runtime evaluation uses this app’s `model.ts`, so the approved package has the same meaning in preview and gameplay. A local draft lives in browser storage; changes do not automatically update the runtime default. Export and review changes before replacing both JSON defaults together.

The overall map combines terrain with a toggleable civilization overlay. Ocean/river/lake water stays blue; void and chasm are black. Traversal is inspectable separately. River crossing relief changes permission, not water identity.

Civilization includes living population, impact age, infrastructure and independent cultural variables. Affiliation fields represent enum-backed identities; AI supplies names. Inside and underground support connected enclosure. Off-ground patches support elevated settings.

Variation gradients: Whimsy, Chaos, Fantasticness, Unexpectedness, Interestingness, Absurdity, Opportunity, Danger, Vibrance, Psychedelic and Terrifying. Psychedelic and Terrifying match Whimsy’s recipe with independent channels. Existing drafts receive these two missing variables once without overwriting edits. Distance escalation is shared and bounded; zero stays zero.

Occurrence signals select actual gameplay events. Descriptive variation cannot create extra occurrences, change traversal or invent rewards. The schema/default and distance-escalation checks are in `../tests/sky-weather.test.ts`; these are focused non-generation tests.

Water/void tuning (September 9): inland basin candidate rates are 2.5x with unchanged 12–44 cell diameters and the existing altitude, erosion and exclusion masks. Void district/core scales are divided by sqrt(2), doubling spatial frequency per area; the cutoff is eased from 0.72 to 0.65 for greater coverage. Independent 3–9 cell void pockets are combined before the ocean mask. Overlap and masks determine actual coverage; these are recipe rates, not measured coverage ratios. Default seed: `lanterns-on-the-long-road`.

### Encounter and barrier rebalance (September 9)

The current default seed is `lanterns-on-the-long-road`. Each non-portal occurrence (challenge, option, gift, certain death and relic) has two independent candidate patterns instead of one, approximately doubling opportunities; overlaps and civilization boosts affect realized rates. Portal points are halved at baseline after accounting for the nine-cell local-maximum rule. Portal jump radius is `max(50, 5 × distance from origin)`.

Option encounters have a 5% portal gate on their first active response; other option branches, including nested challenges, cannot independently introduce portals. Automatic challenge branches also use a 5% portal roll. Remaining outcomes use the other existing mechanisms. Standing-result chance doubles to `min(1, 2 × (0.15 + 0.7 × devoutness))`; point amounts are unchanged.

Severe-weather patches occur one-third as often, retaining their strength and size. Ocean, void, chasm and river noise layouts have twice the spatial frequency per area (scales divided by sqrt(2)); small-void patch spacing is divided by sqrt(2), while lake patterns are duplicated on independent channels to retain their sizes and minimum separation. This increases barrier frequency, not a promised exact doubled blocked-area percentage: masks and overlaps still apply, and river crossing relief remains separate. Migration 0031 performs the requested world/progress reset while preserving accounts, credentials, sessions and defining traits, and queues removal of old illustrations.

Underground can overlap civilization and Inside. Combined enclosures support dungeons, mines, crypts and other constructed subterranean spaces; they no longer force a natural cave. Off-ground poles suggest raised platforms at low intensity and context-appropriate treehouses, canopy walkways, suspended settlements or floating islands at high intensity.
