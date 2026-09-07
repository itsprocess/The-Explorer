# Possessions, status and conditional encounters

No world wipe, seed change, namespace change, or database migration is required. Legacy characters read as having no active traits; their next arrival persists the optional `traits` array. Existing canonical cells keep their original encounters. Controlled grants and conditional branches are authored for newly generated cells only. Old traps do not acquire an unwritten protection branch retroactively.

## Registry and ownership

The application chooses all mechanical properties before text generation. The LLM provides a name, short description, and historical prose, never executable conditions or enum values.

| Status family | Allowed values |
| --- | --- |
| Social rank | commoner, artisan, noble, royalty |
| Blessing | speed, ward, luck |
| Burden | exposure, illness, haunting |
| Reputation | trusted, feared, disgraced |
| Attunement | flame, tide, stone, wind |

Only one value per status family is active. Receiving a different grant in that family replaces the old entry, even if it was permanent. An absent family grants no implicit benefit. Social grants are restricted to contexts with people; ranks do not replace canonical rulers.

Possessions can coexist and have three fixed dimensions: purpose (protection, passage, perception, craft), affinity (stone, water, air, spirit), and material (mineral, organic, metal, woven). Each distinct source grant has a stable identity; returning while holding the same grant does not duplicate it. Material affects creative interpretation; conditions currently match purpose and affinity.

Every entry stores its generated name and description, mechanical properties, lifetime, source coordinate/title/world, and acquisition visit ID. The profile displays active entries and links to their source and a name-based history search.

## Lifetimes and repeat behavior

- **Permanent:** survives death and matching encounters; may be replaced by another status in its family.
- **Until death:** remains active through uses and journeys, then is removed on death.
- **Single use:** removed when its condition actually matches an encounter; also lost on death if unused.

Controlled grant sites use `every_visit`. A character may reacquire a gift after losing, consuming, or replacing it, but receives no duplicate while still holding the same source grant. Acquisitions, replacements, uses and death losses are explicit `stateChanges` in the committed visit record. Character state and its history remain in the same revision-guarded D1 batch; replaying a movement ID cannot award or consume twice.

## Conditions and generation

Near-origin encounter frequency is unchanged. Of already selected benign interactions, 22% grant a trait, a further 20% have a conditional narrative, and the remainder retain ordinary behavior. Grants choose permanent/until-death/single-use with 20/40/40 percent weighting. Existing origin safety overrides all state mechanics.

New lethal trap cells receive a fixed matching condition: an applicable blessing or protection possession. When matched, the prewritten escape branch replaces death, single-use protection is consumed, and neither death count nor a death badge is awarded. Unmatched visitors receive the original lethal outcome. These are specific protections, not universal immunity; foreign-honor enforcement is still separate. Benign checks produce a different prewritten experience for matching social status, reputation, burden, attunement, or possession tags. A single-use trait is consumed when used by one of these branches as well.

The scene schema adds `trait_name`, `trait_description`, and `conditional_narrative`. Validation requires appropriate content only when the app selected that mechanic, including `{character_name}` and `{trait_name}` placeholders for conditional historical prose. Canonical descriptions never assume that the visitor matches. Neighbor previews do not expose trait grants or conditions. Images retain their existing settings and depict the canonical location; protection does not rewrite the art. Arrival requires no extra LLM call.

## History search

Both in-game and shared profiles offer a collapsed history browser with text search, filters and 25-record pages. Filters cover acquisitions, replacements, losses, uses, deaths, escapes, transport and encounters. Search includes prose, trait metadata and provenance, plus coordinates. A source may therefore be found even when the searched name appears only in a loss record. SQL parameters and literal escaping handle quotes, percent signs and underscores safely. An explicit public character ID exposes the same history already shared on that character's public profile; an omitted ID requires the logged-in character.

## Validation

44 tests cover registry validity, deterministic rule selection, replacement and duplicate prevention, survival/consumption/loss, source tracking, legacy compatibility, and search semantics alongside existing world and concurrency rules. An HTTP/auth/D1 integration run with local cached fixture cells verified acquisition, idempotent replay, single-use survival, subsequent death, permanent survival, return to origin, and filtered private/public history. Live AI prompt evaluation was attempted but blocked by OpenAI HTTP 429. Fixture cells are local only and are not deployed.
