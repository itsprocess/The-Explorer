# Fieldwork: agreed direction and specification

## Status and source of truth

The user has approved the current sandbox approach and visual result. Continue
from it; do not replace authored recipes with older starter proposals.

The latest supplied baseline is `C:/Users/elsof/Downloads/fieldwork-project (6).json`.
Its river and crossing changes were preserved. Subsequent approved changes add
organic Civilization patch boundaries and the overall map's final colors. The
stored consolidated snapshot is `outputs/sandbox-projects/fieldwork-organic-civilization.json`
(relative to `web`). Later user exports supersede that snapshot.

Recipes in the project JSON are the numeric source of truth. This document defines
behavior and boundaries; it does not duplicate every tuning value. Older decisions
are retained in [FIELDWORK-DIRECTION-HISTORY.md](./FIELDWORK-DIRECTION-HISTORY.md).
Remaining work is in [FIELDWORK-IMPLEMENTATION-PLAN.md](./FIELDWORK-IMPLEMENTATION-PLAN.md).

## Workflow and category order

Use one editable, top-down sandbox to audit algorithms, variables, language poles,
enum descriptors and prompts outside the game. Bring the reviewed result back into
The Explorer as a new baseline through an explicit integration stage.

1. **Biome:** the natural environment and the only source of traversal rules.
2. **Civilization:** inhabitation, historical impact, culture and populations.
3. **Uniqueness / Variation:** distance-escalated distinctiveness and rare opportunity/danger flags.
4. **Occurrences:** events and situational phenomena.

Biome interpretation precedes Civilization interpretation, followed by Uniqueness interpretation. Uniqueness fields are now implemented; its AI pass and Occurrence behavior remain future work.

## Deterministic foundation

All world fields are deterministic for a project/recipe revision, seed and cell.
Variables retain app names, natural names, definitions and typed outputs:

- Boolean: an inclusive cutoff and off/on descriptors.
- Enum: editable named steps with inclusive cutoffs and descriptors.
- Gradient: continuous strength with low/high natural-language poles.

Noise stacks remain editable data: source, stable channel, scales, position offsets,
rotation where applicable, transforms, gain, value offset and blend operations.
Keep source, adjusted signal, accumulated signal and interpreted output inspectable.
Preserve the current operator order, especially the Perlin contour-band transform;
do not silently substitute a different formula during game integration.

Presence and intensity are different. Outside an assigned footprint, a variable is
**Absent**. Inside it, zero can mean a valid low pole or first affiliation option.
Presence gates must not multiply away independent trait strength. A tiny settlement
can still have high wealth, advancement, aggression or species homogeneity.

Dependencies form an acyclic graph, including presence references. Renaming labels
must not reseed fields. Evaluating a cell must not depend on visit order or map zoom.

## Traversability is authoritative, not AI-generated

Only Biome variables affect exploration. Any active blocking rule blocks the cell;
a passable variable cannot override another blocker. The same resolution is used
by map inspection, Civilization masking and eventually game movement validation.
Non-Biome variables cannot influence a blocking Biome indirectly through references
or presence masks either.

Ocean, Lakes/Ponds, Void and Chasms block under their authored rules. River geometry
and crossing difficulty are separate. The approved sixth export uses River as the
presence footprint of a binary River Crossing Barrier. The barrier starts at one
and subtracts local Perlin to open crossings. It no longer uses the earlier separate
Relief variable. Preserve that authored recipe; historical relief proposals are
not the current baseline. Crossing opportunities do not prove global connectivity.

The shared Civilization traversal constraint is enabled. Every Civilization output,
including impact, infrastructure and the current animal fields, is absent on blocked
cells. The sandbox switch permits experiments; integration must preserve the
approved setting. AI cannot create a bridge, ford or other narrative exception that
changes these mechanics. Any future exception needs an explicit mechanical design.

## AI interpretation passes

### Pass 1: interpret the Biome

Provide evaluated natural fields, explicit presence, type/descriptor information,
coordinates, seed/recipe revision and authoritative traversal with blocking reasons.
Use established nearby context where available to maintain environmental continuity.

AI compiles those inputs into a coherent natural setting: terrain, vegetation,
water, moisture, weather and other environmental details. It synthesizes combinations
rather than merely reciting percentages. The setting may be named or described
naturally without reducing all combinations to a hardcoded biome enum.

This pass is environmental only. It does not invent civilizations, factions, cities,
ruins or encounters. It cannot alter signals, classification, water presence or
explorability. Claims about local terrain must agree with the computed fields.

### Pass 2: interpret Civilization

Provide the accepted Biome interpretation, authoritative field outputs, Civilization
presence/impact/density, cultural traits, affiliation slots, population mixture and
any established local entity identities.

AI compiles inhabitation and culture appropriate to that natural setting. It can
express recent or ancient civilization, active or abandoned sites, sparse or dense
habitation, low or high technology and infrastructure, and varied populations.
Use independent axes as authored: do not infer wealth from technology, advancement
from age, or aggression from an affiliation slot or species mixture.

No current habitation means no invented resident crowd. Historical impact can still
support remains and former cultural associations; high infrastructure can support
ruins, but impact alone does not require standing architecture. Activity-like fields
at uninhabited sites must be interpreted as potential or historical traces, not as
proof of current residents. No impact means no invented civilization footprint.
Independent wildlife can still exist according to its own fields.

These are two logical AI interpretation passes, with the second consuming the first.
Exact call packaging, response schemas, model selection and caching are implementation
choices still to be reviewed. No AI interpretation calls are implemented by these
notes. Later passes must preserve the facts established by earlier stages.

## Civilization shape and meaning

Current habitation uses scattered, multi-size pods, from approximately single-cell
sites to 30-ish-cell settlements. Historical impact has independent blotches plus
all currently inhabited cells. Their union is the Civilization Impact Footprint.
Organic, seeded boundary noise gives these patches uneven outlines. Keep expanses
without civilization; avoid returning to a continuous populated blanket or perfect
circles. Envelope sizes are not guarantees of exact final occupied widths.

All cultural traits, including Infrastructure Level, use that shared impact mask.
They retain independent variation within it. Infrastructure does not define the
footprint and does not imply current use, good condition or high technology.
Civilization Impact Age means how far back civilization impact reaches, not time
since abandonment. Recent ruins, old ruins, recent habitation and old habitation
are all valid combinations. Maintenance and ruin-builder technology are not yet
separate fields.

The other axes include advancement, aggression, commerce, wealth and species
homogeneity. Combinations should emerge from the independent fields, not from
fixed settlement archetypes. Independence permits diversity; it does not guarantee
that every combination appears within one finite viewport.

Human and non-human organized communities use the same Civilization fields.
Species homogeneity is simply mixed versus one dominant population, such as an
intermingled community versus only Gorloks. It is not a species identifier or a
measure of intelligence, hostility or technology.

Animal Population and Animal Species Homogeneity represent terrestrial wildlife
separately. Only wolves is a valid high-homogeneity animal population. Wildlife
does not imply a civilization, faction or infrastructure. The present recipes and
shared constraint cover terrestrial populations; aquatic/flying habitat is future
work and must not be silently inferred as implemented.

## Abstract affiliation and cross-system mechanics

Faction, Kingdom and Religion enum values are **abstract affiliation slots**.
They are not behavioral archetypes, moral alignments or ranked cultural types.
Eight options each is the current editable starting point, not a universal limit.
Numeric ordering exists for field interpretation and implies no affinity or rank.

Distinguish:

- **Mechanical slot:** the finite identifier rules use.
- **Local entity:** a specific organization, kingdom or religion with continuity.
- **Narrative identity:** its AI-supplied name, history, customs and descriptions.

Many distinct local entities can share a slot. A recurring entity must retain its
identity across cells and visits; a shared slot alone does not imply the same
organization. Finite mechanics can support indefinitely many narrative identities.

Items and statuses follow the same approach. Explicit relations can make one item
type heal one status type or make an affiliation protect against imprisonment by
another. AI supplies a contextual explanation, not a new mechanical relation.

Integration needs stable namespaced slot keys, entity IDs and explicit relation
rules. Do not use generated names or mutable enum array indices as mechanical keys.
Current local enum-step IDs are not yet a shared registry. Registry mapping across
factions, kingdoms, religions, items and statuses, overlapping affiliations,
unaligned populations and territorial identity boundaries remain design decisions.

## Inspection and presentation

The Overall map combines terrain, vegetation, exposed stone and water. Void and
Chasms are black. Ocean, lakes and rivers are blue even when not traversable.
Colors never determine movement permissions. Civilization is a toggleable overlay:
habitation in amber/cream, historical impact in lavender. Hiding it changes rendering
only. Other variables remain inspectable separately and through cell context.

Keep every-cell and every-10-cell views. Coarse sampling can miss small settlements
or crossings and fragment continuous features visually. The per-cell traversal
inspector remains the mechanical authority, independent of display resolution.

## Implementation boundary

Implemented: editable deterministic fields, presence masks, graph validation,
biome traversal, global Civilization constraint, interpreted descriptor fragments,
overall and component maps, import/export, local backups and Undo.

Planned: structured AI interpretation passes, persistent narrative identities,
shared mechanical registries/relations, game-engine integration and later categories.
The sandbox is the approved working basis, not an already deployed game baseline.
Do not reset worlds, run paid AI generation or publish as part of writing these notes.

## Uniqueness / Variation: distance escalation and rare points

Nine editable fields now exist: Whimsy, Chaos, Fantasticness, Unexpectedness, Interestingness, Absurdity, Opportunity, Danger and Certain Death. The first eight combine an independent smooth fBm background weighted to at most 0.12 at origin with rare isolated sparks in the 0.5–1 range. Low interestingness means understated, not poor writing. Only Certain Death is a boolean flag with a single-cell source and a 0.998 candidate cutoff. Certain Death is a data flag, not an implemented automatic death mechanic.

The app applies a shared radial escalation only to the variation category. For d = hypot(x,y), drive = (1 + d / reach)^power and escalated strength = base^(1 / drive). Defaults are reach 200 cells and power 0.5. The drive grows without a finite distance cap, while positive values approach 1. Exact zero remains zero. This is OI-inspired bounded growth, not a verbatim port of the OI library, whose C++ and C# growth implementations differ. Background 0.1 becomes 0.153 at 100 cells, 0.391 at 1,000 and 0.724 at 10,000. This encodes the intended noticeable → a little wild → extreme progression; subjective tuning remains reviewable.

Spark candidate cutoff becomes cutoff^drive. A seeded eight-neighbor local-maximum test prevents adjacent sparks from joining; each source spark occupies exactly one cell. Separate seeded amplitude varies the continuous-field sparks, while flag sparks output one. Near-origin 0.998 produces about 0.2% candidates before local-maximum suppression; at 10,000 this is about 1.42%. Randomness is coordinate-based, not elapsed-time or visit-order based. Strength and candidate frequency rise; point size does not. Independent fields may coincide. The global distance controls and source candidate cutoff/intensity floor are exposed in the editor.

Escalation occurs after each variation variable stack and before output classification; source and stack traces remain pre-final-escalation. References consume already interpreted outputs, so avoid unintentionally applying repeated growth through variation-reference chains. No existing biome or Civilization fields are changed. These new fields have no traversal effects and are not currently suppressed by civilization presence. Later event/narrative consumers must still respect mechanical traversability. The third AI interpretation pass will enrich the established natural setting and culture while preserving both. It is not implemented yet.

Variable capacity is now 48 (the current reviewed snapshot plus Uniqueness contains 35). Enum step capacity remains 32. Updated export: outputs/sandbox-projects/fieldwork-uniqueness-refined.json.

## Occurrences: points and mechanical contracts

Certain Death now belongs to Occurrences, alongside Teleport, Gift and Challenge. Uniqueness retains eight continuous fields. Certain Death preserves its source, seed address and 0.998 candidate cutoff. The other three use independent single-cell sources at 0.997: 0.3% candidates versus 0.2%, approximately 1.5 times as frequent after neighbor suppression. Occurrences do not inherit Uniqueness distance escalation. Points may overlap across fields; resolution priority remains a later app decision. None changes biome traversability.

Gift grants a registered item or status type. Challenge checks for a registered item/status or affiliation such as faction or religion. Finite abstract enum identities are shared across these systems; AI creates contextual narrative descriptions without inventing mechanical equivalence. The app resolves possession, affiliation and compatibility using IDs, not text. Consumption must be an explicit rule, separate from an existence check.

Planned app contract: derive action family and backing enum ID from world seed, integer tile coordinates, occurrence channel and a versioned registry, with independent deterministic random channels for each choice. Assignments remain stable across visits and AI retries. Send these authoritative grant/requirement IDs with biome, civilization and uniqueness context to the AI. Persist narrative identities separately. Teleport destinations, challenge consumption/rewards, registry contents and death resolution remain to be designed; occurrence fields alone execute no effects.

Implemented here: four editable occurrence maps, migration preserving existing field IDs and authored recipes, and import/export. Shared registries, per-tile enum payload assignment and game resolution are planned, not yet implemented. Updated snapshot: outputs/sandbox-projects/fieldwork-occurrences.json.

## Approved occurrence contract and snapshot 7

The supplied fieldwork-project (7).json is the exact reviewed baseline, preserved in sandbox/reviewed-project.json and imported once with a browser backup and Undo. Source candidate cutoffs: Teleport 0.995, Gift 0.996, Challenge 0.996, Certain Death 0.997. These supersede the initial frequency proposal. Source outputs are binary, so the separately authored interpretation cutoffs remain unchanged.

A challenge has exactly two authored outcomes: requirement present and requirement absent. Presence is determined by the app using registered enum IDs against inventory, status or the applicable affiliation registry. The AI may make either branch narratively positive or negative; possession must not be equated with positive narrative valence. No extra generated success/failure roll or third outcome is implied.

For a tile containing both a challenge and a gift, evaluate the challenge against pre-gift player state, select its present/absent branch, then grant the gift only on requirement satisfaction (mechanical success). A gift on that tile cannot supply its own challenge prerequisite. A gift without a challenge can resolve directly. Both app and AI receive this ordering and gift eligibility; the AI must not describe an ineligible award as received.

Awards may include status, inventory items and/or badges. Use typed registry IDs and explicit quantities or parameters; narrative names do not establish mechanical type compatibility. Requirements may use status or inventory and the previously discussed affiliation types. Checking existence does not automatically consume an item or remove a status. Any consumption must be explicitly specified. Persist the challenge resolution and awards together with an idempotency key to prevent duplicate awards on retries; revisit/repeatability policy remains to be defined.

This is the agreed future app/AI contract. The sandbox currently edits occurrence fields and does not yet run challenges or grant rewards. Teleport/death ordering relative to other occurrences remains unspecified.

## Expressive language palette

All 38 current variables now have a stronger descriptive range. Low and high poles are vivid endpoints, not default prose for every nonzero value. Interpolate proportionately: a value near 0.1 should stay close to the restrained low end, while extreme language belongs near an extreme. Use sensory detail, scale, material texture, social behavior and evocative local identity rather than repeating stock adjectives. Low interestingness permits quiet, observant writing; it never requests dull or low-quality prose.

Keep axes independent. Ancient need not mean ruined, advanced need not mean wealthy, homogeneous need not mean hostile, and whimsical need not mean safe. Presence masks take priority: an absent civilization field must not be narrated as an impoverished existing settlement. Boolean off text denies only that feature, not all hazards or other kinds of water. Faction, kingdom and religion enums retain neutral mechanical identities; their descriptive richness comes from contextual narrative realization, not assigning a fixed culture or alignment to each slot.

Language never creates mechanical effects, rewards, damage, crossings or destinations. App facts and the challenge-before-gift contract remain authoritative. The language palette is applied once to the browser draft with a backup and Undo, retaining authored algorithms, IDs, cutoffs, masks and distance settings. Recipe defaults share the same wording. Snapshot: outputs/sandbox-projects/fieldwork-language-palette.json. This supersedes the exact snapshot-7 wording only; its numerical recipes are preserved.

## Frontier transitions, interiors, choices and defining traits

Agreed transition model: each neighboring connection has two directional text records, A→B and B→A, with short derivative descriptions and no standalone images. Generate outgoing records only when preparing their origin cell, using destination peeks. Complete required outgoing text before queuing that cell's image. The first frontier cell establishes shared boundary facts (for example a doorway); the later cell and its reverse transition honor those facts with richer context. A connection settles when both directions exist. Preserve established geometry rather than rewriting the first direction into contradiction. Both navigation and each image prompt consume the relevant outgoing records and shared boundary facts.

Sandbox additions: binary civilization.inside uses Perlin contour veins plus bounded rough pockets of 1–4 cells, restricted to positive civilization footprint and infrastructure. It covers constructed interiors and built underground spaces. Binary biome.underground uses independent veins/pockets outside civilization footprint for natural caves and passages. These are descriptive setting fields, not new vertical coordinates or traversal overrides. Underground's exclusion references civilization, so it cannot enter a traversal-blocking dependency chain; existing graph validation enforces this. AI biome interpretation should receive the resolved underground value without interpreting civilization culture in the biome pass. Enclosed settings must not be described as open sky; match shared exits between cells. Existing water and hazard facts still apply.

Option is an isolated binary occurrence at .996 source cutoff. Planned payload: seeded 2–3 choices, each assigned an app result type and parameters before AI writes the choice/outcome. Result types: give, challenge, teleport, badge, kill. The app executes only the selected result. A seeded policy selects per-visit versus once-per-life availability. Death resets all choice state for the next life. Default proposal: preserve tile choice definitions across visits/lives while resetting availability; re-rolling definitions was not requested. A visit is a new arrival, not a page refresh or request retry. Per-visit outcomes require a visit identity and idempotent resolution; once-per-life outcomes require a life identity. Challenge results reuse the two-branch requirement contract and gift ordering.

Defining Trait is one fixed mechanical enum selected by the player at character creation, immutable for that character: Strength, Kindness, Wit, Speed, Cunning, Charisma, Resolve, Faith. Wit covers quick reasoning; Cunning tactical ingenuity/deception; Resolve courage and perseverance; Faith conviction and spiritual trust, without implying a particular religion affiliation. Treat these as abstract requirement types usable throughout occurrence pipelines, not numerical stat bonuses or fixed classes with invented abilities. Narrative descriptions may vary; mechanical identity remains stable.

Travel readiness waits for required cell text, outgoing transition text and app calculations, never for image completion. After that state is ready, enqueue image work in the background and allow immediate travel. Deduplicate jobs, prioritize the current cell, and associate completion with cell and prompt revision so a late result cannot attach to the wrong place. Returning displays saved or pending imagery. Image failures do not block navigation; retries must not rerun cell effects or charge duplicate work without the appropriate job policy.

Implemented now: three editable sandbox variables, bringing the baseline to 41, with backup/Undo migration and export at outputs/sandbox-projects/fieldwork-interiors-options.json. Planned game work: directional transition lifecycle, option payload generation/resolution and visit/life state, creation-time trait selection, and background image queue. No paid generation or game mechanics were run for these additions.
