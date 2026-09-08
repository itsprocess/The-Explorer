# Fieldwork implementation plan

This is a plan for future work, not authorization to execute every stage now.
[FIELDWORK-DIRECTION.md](./FIELDWORK-DIRECTION.md) is the agreed specification.
The user has approved the current field/masking/visualization approach.

## 1. Freeze and identify the reviewed data contract

- Preserve the approved export, recipes, source channels, presence references and
  traversal rules. Accept later authored snapshots without replaying obsolete defaults.
- Define the game-facing versioned cell payload: coordinates, world/recipe revision,
  variable identity, type, raw/interpreted value, presence, language descriptors,
  mechanical slot where relevant, explorability and all blocking reasons.
- Treat a valid zero/first enum value differently from Absent. Keep projection or
  display concerns out of the mechanical payload.
- Specify how recipe revisions interact with previously generated cells and worlds.
  Do not silently regenerate or reset existing world data.

Acceptance: the same seed, recipe and coordinate produce equivalent sandbox and
integration payloads, including negative coordinates and threshold boundaries.

## 2. Make deterministic traversal the shared game constraint

- Reuse the existing evaluation and blocker semantics; avoid duplicating algorithms
  inside prompts or a second renderer-specific implementation.
- Resolve Biome first. Apply the global traversability mask to Civilization.
- Connect the result to movement/exploration validation and map display without
  granting the AI authority to change the result.
- Validate blockers and crossing gaps on small, targeted fixtures. If guaranteed
  connectivity becomes a requirement, design it explicitly as additional work;
  do not claim noise sampling proves it.

Acceptance: blocked lakes/ocean/void/chasms and river barriers remain blocked under
any Civilization/AI output. A valid river crossing remains explorable when no other
blocker applies. Category and dependency rules prohibit reverse influence.

## 3. Specify and implement the Biome interpretation pass

- Write the first prompt and response contract around evaluated natural fields,
  presence, descriptors, traversal and existing environmental context.
- Define the structured natural-setting response and validation rules before using
  free-form prose as persisted state.
- Keep habitation and cultural invention out of the environmental pass.
- Start with hand-authored fixture responses and mocked model calls. Paid generation
  is a separately authorized validation step.

Acceptance examples: wet lowland, exposed highland, forested ground, traversable
river segment, blocked water and absent terrain all retain their computed facts.
No response can change traversal or invent an active civilization.

## 4. Specify and implement the Civilization interpretation pass

- Consume the accepted Biome result plus the masked Civilization fields.
- Include explicit current density, historical impact, impact age, infrastructure,
  technological capability, species mixture and affiliations.
- Define current versus historical associations so zero density cannot become a
  bustling settlement just because commerce/wealth fields have high values.
- Keep wildlife distinct from organized human or non-human habitation.

Acceptance examples: recent ruins, ancient ruins, dense low-tech monoculture,
intermingled settlement, advanced sparse community, little infrastructure, abundant
infrastructure, wildlife-only site and no civilization impact. Validate strong
traits at tiny sites and explicit absence outside footprints.

## 5. Establish durable identities and shared mechanics

- Agree on namespaced slot registries and relation tables for factions, kingdoms,
  religions, statuses and items; resolve shared versus mapped namespaces explicitly.
- Specify local entity creation/assignment, territory continuity and overlapping
  membership. A slot is not itself an entity ID.
- Persist generated identities and reuse them across cells and visits.
- Implement authorized item/status and affiliation interactions against mechanical
  identifiers. Narrative names and prose cannot change their effects.

Acceptance: distinct names can share a mechanical slot without collapsing into one
entity; repeated encounters reuse an entity; healing/protection rules remain stable
through renaming and narrative variation.

## 6. Persistence, validation and integration

- Design revision-aware caching and persisted outputs for both interpretation stages.
  Include upstream Biome revision in Civilization dependencies.
- Specify retries, invalid-response handling and idempotent entity creation so a
  retry cannot duplicate identities or fabricate a fallback world state.
- Review prompt/context size and available regional context. Do not create a new
  sampling dependency on which neighboring cells happen to be visited first.
- Integrate the approved payload and passes into The Explorer in a bounded change,
  preserving accounts, sessions and world data.
- Run targeted non-generation tests and the documented release checks. Publication
  is a separate requested action following EDIT-AND-PUBLISH.md.

## 7. Design later categories

After Biome and Civilization contracts are reviewed, define Uniqueness / Variation
and Occurrences: their fields, meaning, dependencies, persistence and interpretation.
They must not override biome traversal or contradict accepted world facts.

## Decisions still open

- AI response schemas, model choices, call packaging and contextual scope.
- Entity/territory boundaries, multiple affiliations, unaligned cases and slot mapping.
- Maintenance/decay and explicit ruin-builder technology if the current axes are
  insufficient for the desired descriptions.
- Aquatic/flying populations and any future traversal exceptions.
- Existing-world adoption and revision migration policy.

These are open implementation decisions, not missing pieces of the approved visual
sandbox that should be filled in without discussion.

## Uniqueness follow-up

The nine Uniqueness data fields and app-level distance escalation are now implemented. Stage 7 should begin with the third AI interpretation contract for those existing fields, rather than recreating their algorithms. Opportunity/Danger/Certain Death have no automatic gameplay effects yet; define their consumers and relation to Occurrences before integrating them. Preserve traversability and established Biome/Civilization facts. Occurrences remain unspecified.

Occurrence follow-up: implement the deterministic, versioned grant/requirement enum contract described in FIELDWORK-DIRECTION.md, then expose payload inspection and integrate app resolution before AI narration. The sandbox currently supplies four point maps only (Certain Death, Teleport, Gift, Challenge); no item/status mutation, teleport or death mechanic runs.

Snapshot 7 contract refinement: implement exactly two challenge branches (requirement present/absent), with narrative valence chosen independently by AI. Evaluate using pre-gift status/inventory/affiliation IDs; resolve challenge before a co-located gift and permit that gift only on requirement satisfaction. Support status, inventory and/or badge awards. Persist resolution and awards idempotently. Do not infer consumption or repeatability. See the latest FIELDWORK-DIRECTION.md section; runtime implementation remains pending.

AI prompt integration must use the expressive language palette proportionately across each continuous range, honoring absence and independent dimensions. Extreme descriptors are endpoints, not instructions to inflate small values. See FIELDWORK-DIRECTION.md for the language contract.

Next game integration work: shared frontier boundary facts and two directional transitions before image enqueue; text/calculation-only navigation readiness with independent image queue; 2–3-choice Option payloads with per-visit/once-per-life policy and death reset; immutable creation-selected Defining Trait enum (Strength, Kindness, Wit, Speed, Cunning, Charisma, Resolve, Faith). Reuse typed occurrence result contracts and idempotent visit/life resolution. Interior/Underground are now editable sandbox setting fields; they do not add vertical maps or traversal overrides. Full decisions are in FIELDWORK-DIRECTION.md.

## Local game integration — Fieldwork baseline 1

The game now reads lib/fieldwork-baseline.json (41 approved sandbox fields) through the same evaluator. Biome blockers determine traversal; origin remains the explicit safe spawn. The old grid-backbone topology is no longer used. Saved generation is namespaced as fieldwork-1; prior records and accounts are retained rather than rewritten or reset.

Implemented: sequential cached biome, civilization and variation AI interpretation; scene compilation with neighboring continuity; two directional exit texts persisted as transition records and boundary settlement when the reverse exists; outgoing descriptions feed navigation and images. Occurrence payloads are deterministic, with typed status/item/affiliation/defining-trait requirements, two challenge branches, challenge-before-gift, death/teleport/gift/challenge/option points, 2–3 option outcomes, per-visit or per-life option availability, and death clearing choice consumption. Option and movement writes use revision guards and request IDs. Gifts award typed items/statuses and badges. Abstract faction/religion/kingdom slots are status families for shared grant/check semantics.

Creation selects Strength, Kindness, Wit, Speed, Cunning, Charisma, Resolve or Faith once. Existing accounts without a trait receive a one-time selection. Death preserves the trait, badges and history and applies existing item/status lifetimes. Teleport uses seeded radial displacement up to max(50, distance), without safety filtering; invalid destinations produce cached narrated death and the usual badge/lifetime handling.

Text readiness reveals the page independently of image completion. Image work starts asynchronously through the existing persisted provider queue; current-location queued images are prioritized, old queued images demoted, and signatures deduplicate work. Restarted image work resumes on a subsequent location/image request; no separate image daemon is introduced.

Local scope only: no hosting bundles, public updates or data reset. No paid generation was run. Legacy broad distribution tests describe the replaced generator and are not used to recalibrate the approved baseline. Narrative quality and real provider output still need an explicitly authorized live playtest.
