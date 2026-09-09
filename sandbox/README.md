# Noise app

Run `npm run sandbox` from `web/` and open http://127.0.0.1:4317. Build with `npm run build:sandbox`; output is `web/outputs/sandbox/` and is not committed. The app is independent of Sites, character accounts and AI providers.

The reviewed default is `reviewed-project.json`, identical to `../lib/fieldwork-baseline.json`. Runtime evaluation uses this app’s `model.ts`, so the approved package has the same meaning in preview and gameplay. A local draft lives in browser storage; changes do not automatically update the runtime default. Export and review changes before replacing both JSON defaults together.

The overall map combines terrain with a toggleable civilization overlay. Ocean/river/lake water stays blue; void and chasm are black. Traversal is inspectable separately. River crossing relief changes permission, not water identity.

Civilization includes living population, impact age, infrastructure and independent cultural variables. Affiliation fields represent enum-backed identities; AI supplies names. Inside and underground support connected enclosure. Off-ground patches support elevated settings.

Variation gradients: Whimsy, Chaos, Fantasticness, Unexpectedness, Interestingness, Absurdity, Opportunity, Danger, Vibrance, Psychedelic and Terrifying. Psychedelic and Terrifying match Whimsy’s recipe with independent channels. Existing drafts receive these two missing variables once without overwriting edits. Distance escalation is shared and bounded; zero stays zero.

Occurrence signals select actual gameplay events. Descriptive variation cannot create extra occurrences, change traversal or invent rewards. The schema/default and distance-escalation checks are in `../tests/sky-weather.test.ts`; these are focused non-generation tests.
