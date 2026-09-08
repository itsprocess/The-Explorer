# Fieldwork sandbox

The current sandbox approach is approved for the next implementation stage. Read [FIELDWORK-DIRECTION.md](./FIELDWORK-DIRECTION.md) for the consolidated specification and [FIELDWORK-IMPLEMENTATION-PLAN.md](./FIELDWORK-IMPLEMENTATION-PLAN.md) for remaining work.

Run `npm run sandbox` from `web` and open http://127.0.0.1:4317/. The app has an Overall map, a toggleable Civilization overlay, component lists, individual/intermediate field views, and per-cell values, presence and traversal reasons. View at every cell or every 10 cells; coarse sampling can miss small features. Void and Chasms are black; water is blue. Display colors do not determine traversal.

The approved stored snapshot is `outputs/sandbox-projects/fieldwork-organic-civilization.json`, based on the sixth user export with organic habitation/impact boundaries. Preserve later authored exports if supplied. Browser edits live under `explorer-fieldwork`; imports and recipe migrations have backups and Undo. These are sandbox data, not deployed game defaults.

Validation: `npm run test:sandbox`, `npm run typecheck`, `npm run build:sandbox`. Game release and publication follow EDIT-AND-PUBLISH.md separately.

## Historical implementation log

The material below records successive implementation steps, including obsolete recipes and UI descriptions. It is not the current specification.

# Fieldwork sandbox

Current additions: River has a smooth altitude fade from 0.55 to 0.85, placed
before existing subtractive detail so weak highland channels disappear. Void,
Groundcover and Trees / Large Foliage are editable recipes from
`sandbox/biome-expansion.json`. Altitude and Ocean settings are preserved.

Generic reference operations now include fade-out and fade-in. With start a and
end b, t = clamp((source-a)/(b-a)) and smooth = t*t*(3-2*t). Fade-out returns
1-smooth; fade-in returns smooth. Layer inversion, gain/offset and blending follow.
The editor exposes both bounds and rejects reversed or equal bounds.

Void uses broad fBm districts multiplied by smaller inverted cellular cores,
with cutoff 0.72. It represents absent ground at any altitude outside Ocean.
Groundcover fades from altitude 0.65 to 0.95. Trees / Large Foliage has its own
woodland patches, modest groundcover support, clearings and a 0.55–0.80 treeline
fade. River and both growth variables exclude Void; growth also excludes Ocean.

In the supplied export's origin viewport (960 × 960 cells, every 10 cells),
Void occupied 168 of 9216 samples versus Ocean's 839. This is a viewport check,
not a global frequency guarantee. Tests verify fading, recipe preservation,
decreasing river coverage under erosion, and Ocean/Void growth exclusion.

Run npm run sandbox from web and open http://127.0.0.1:4317/.

There is one sandbox and one active project. Variables belong to one of four ordered categories: Biome, Civilization, Uniqueness / Variation, and Occurrences. Categories organize variables without changing their evaluation. The starting view is the component list, showing each proposed variable's purpose, recipe, dependencies, output rule and language. Inspect / edit recipe opens the generic map and layer editor.

The six initial biome proposals are ordinary JSON project data in sandbox/biome-proposals.json: elevation, temperature, moisture, ocean, vegetation cover and exposed rock. They are proposals for review, not approved game defaults. There is no hardcoded biome renderer, field registry or special study mode. Any variable can be renamed, edited, recategorized or removed once its references are removed. New variables inherit the selected category.

Schema v3 adds the variation category and renames man-made to civilization. Version-1 imports migrate to Biome; version-2 man-made categories migrate to Civilization without changing their recipes. Existing legacy drafts combine into the single active project, preserving edited variables; the untouched original example is omitted. Original storage keys remain as recovery backups, not selectable versions. Query strings no longer select a project. The active browser-storage key is explorer-fieldwork. Export JSON for a portable copy; Undo restores in-session edits.

The evaluator is generic: ordered sources (Perlin, fBm, ridged, cellular, white, constant, variable reference), optional inversion, gain and offset, followed by weighted blend and clamping. Reference layers consume interpreted outputs at the same coordinate. Boolean cutoffs are inclusive; enum cutoffs are inclusive lower bounds with a first cutoff of zero; gradients retain 0–1 values and language poles. Dependencies must be acyclic. All these rules apply equally to every category.

The map previews a selected variable or intermediate layer, with coordinate inspection and source/adjusted/accumulated traces. Sampling runs only in map view. The list is the first review surface; no combined landscape classification or prompt generation occurs.

Validation: npm run typecheck, npm run test:sandbox, npm run build:sandbox. The standalone build writes outputs/sandbox. Game generation, world data, hosting configuration and deployments are unaffected. Full prompt composition and production integration remain later work.

The two sampling modes are Every cell and Every 10 cells, centered on the same map coordinate. A 96-sample grid spans 96 or 960 cells. The supplied ocean screenshot at every 64 cells covered a larger extent; it is not an additional zoom mode.

The revised biome proposal data uses independent broad Perlin signals, mostly 2000–4000 cells across, gain 1 and offset 0, with 10% secondary contributions. Ocean defaults reproduce the provided 3000 × 2000 Perlin scale, X offset 345234, stable noise channel, 10% elevation mix at gain 2 without inversion, and boolean cutoff 0.58. Vegetation and exposed rock retain explicit editable land masks.

A one-time recipe refresh applies the requested broad-scale proposals to the existing known biome variables. It preserves existing Perlin ocean stacks, custom variables, and later edits. The pre-update project is saved as a recovery backup in browser storage; it is not a second active sandbox. Import adopts supplied recipes without subsequently replacing them. Civilization can organize factions, religions, cities or other social variables; Uniqueness / Variation organizes distinctive differences before occurrences.

## Contour-band river pass

The active proposal set is now Altitude, Ocean and River. A one-time simplification preserves the earlier project in browser storage; Undo simplification restores it in the same sandbox. Existing River IDs, noise channels, spatial settings and output rules are reused when available, while its signal stack becomes a contour band followed by an inverted Ocean mask. Imports and subsequent saved edits are not automatically retuned.

Perlin/fBm now support Contour band with low/high bounds in the original field. With n as noise after optional inversion, u = (n - low) / (high - low), ridge = 1 - abs(2*u - 1), adjusted = clamp(ridge*gain + offset). Blend and a final clamp follow. No clamp occurs before gain/offset. At gain 1 and offset 0, the bounds map to zero and their midpoint maps to one. Narrow the bounds for thinner contours; gain and offset shape the banks. Invalid/reversed bounds pause preview. Existing proximity mode retains its prior formula and order.

The River visible during the current review reused a 2800 × 3600 Perlin field with a source range around 0.561–0.678 in the origin viewport; it was tuned to low 0.620/high 0.622. Fresh-project defaults use a separate 2200 × 1800 Perlin field and a 0.497–0.503 band. These are ordinary saved recipe parameters, not evaluator exceptions. Contours produce winding channels and loops, not physically routed river drainage.

## Independent ocean footprint with sea-level gate

Ocean retains its own shape-generating layers and boolean cutoff. The former 10% altitude mix is replaced by a final variable-reference gate: Altitude at or below 0.42 returns 1, otherwise 0; multiply at weight 1. Thus both the ocean footprint and sea-level eligibility must pass. The sea level is editable through Reference operation / Gate cutoff. Reference gates are generic sandbox controls, not hardcoded ocean evaluation. Gates run before layer inversion, gain/offset and blend. River recipes are not edited by this fix, though their ocean mask reflects the corrected Ocean.

## Moisture, weather and rock examples

The climate expansion appends three editable gradient recipes and preserves all existing variables. The latest supplied six-variable export is extended at outputs/sandbox-projects/fieldwork-climate-rock.json. Browser drafts receive the additions once, with a before-climate backup and Undo. Imports remain exactly as authored.

- Humidity / Moisture: regional fBm plus local Perlin, multiplied by 1 − 0.75 × altitude. Moisture remains defined over water.
- Weather Severity: smooth fBm background weighted to a maximum of 0.30; sparse bounded patches add up to 0.70. Occupancy is 35% of 32-cell blocks, with independently seeded diameters from 5 to 8 cells and smooth radial falloff. Inspect at Every cell: Every 10 cells can miss an entire patch.
- Exposed Stone / Rock: independent broad and local rocky fields, multiplied by 0.1 + 0.9 × altitude, then masked outside Ocean and Void.

Bounded smooth patches are a generic source, available to any variable. Spacing, occupancy, minimum/maximum diameter, seed channel and position offsets are editable. Diameters are measured directly in world cells; scale and rotation do not apply. A two-cell gap prevents adjacent source patches from joining. Positive value offsets or later blends can extend nonzero coverage; the default weather recipe uses neither to expand patches. The ordinary gain → offset → clamp → blend → clamp pipeline and output interpretation remain unchanged.

## Lakes / Ponds and Chasms

Two editable gradient recipes append once, preserving all existing recipes. Browser drafts have a before-water-fissures backup and Undo. The latest supplied project is extended in outputs/sandbox-projects/fieldwork-lakes-chasms.json.

Lakes use sparse 12–44-cell bounded basins, with 65% occupancy in 85-cell blocks. Regional Perlin varies basin strength; 4×5-cell fBm subtraction roughens the shoreline. Subtracting 0.35 × altitude erases weaker ponds and shrinks others uphill, while stronger basins remain possible at maximum altitude. These are procedural shapes, not hydrological basin simulations.

Chasms use independent 320×200-cell Perlin contours with band bounds 0.485–0.510. A regional Perlin multiplier (gain 4, offset −2.2) suppresses most contours; 5×7-cell subtraction breaks and textures the survivors. This targets lower coverage than River, rather than enforcing a global coverage quota against an editable River recipe. Both additions are masked outside Ocean and Void. Existing foliage and other layers are preserved; no new masks are inserted into them.

## Biome traversability

Variable Output settings now include an optional traversal rule for Biome only: passable (no blocking effect), positive (interpreted output > 0), or threshold (interpreted output >= editable cutoff). Boolean outputs use 0/1, gradients retain strength, and enums use their normalized ordered index. Any blocker wins; passable fields cannot override it. Missing rules default to passable. Non-biome rules are ignored at evaluation; references from blocking biomes to non-biome variables, even indirect or currently disabled, are flagged and prevent traversal evaluation.

The one-time initial configuration makes Chasms boolean at its existing output cutoff and assigns positive blocking to Ocean, Void, Lakes / Ponds and Chasms. Other variables remain passable. All authored noise stacks are retained. Lake output remains a gradient, with any positive water strength blocking by default; its traversal cutoff can be tuned independently of output classification.

Select Inspect → Combined biome traversability for red blocked / green explorable cells. The inspector reports every blocker and exposes deterministic structured biome context with values, language descriptors and traversal. This is input for later AI natural-setting composition; the model will not decide traversal. No AI calls or game-engine integration are introduced in this sandbox change.

Existing browser projects receive this configuration once with an Undo entry and before-traversal local backup. Imports preserve explicitly authored data. The latest supplied project plus traversal settings is outputs/sandbox-projects/fieldwork-traversability.json.

## Civilization study

See [FIELDWORK-DIRECTION.md](./FIELDWORK-DIRECTION.md) for agreed direction, abstract affiliation semantics, the proposed ten Civilization recipes, and deferred integration decisions. The sandbox adds this set once, backs up the prior draft under before-civilization, and opens the Civilization component list for review. Imports remain authored snapshots. The project extended from the approved fourth export is outputs/sandbox-projects/fieldwork-civilization.json.

Infrastructure Level appends independently with its own one-time revision and before-infrastructure backup. Regional fBm and local Perlin have no variable references or traversal rule. Unedited Advancement proposal descriptors now refer to technological capability; authored wording is retained. Updated snapshot: outputs/sandbox-projects/fieldwork-infrastructure.json.

## Current Uniqueness controls

Uniqueness / Variation now contains eight continuous traits (including Opportunity and Danger) with backgrounds capped at 0.12 before distance escalation, and a Certain Death flag. Shared distance escalation is editable in that category. Isolated single-cell sparks expose candidate cutoff and intensity floor. Existing 26 variables are retained. See FIELDWORK-DIRECTION.md for formulas/calibration; export outputs/sandbox-projects/fieldwork-uniqueness-refined.json. Capacity is now 48 variables.

Current occurrence update: Certain Death moved to Occurrences; Teleport, Gift and Challenge added at approximately 1.5x its frequency. All four are isolated binary points. The eight Uniqueness gradients remain unchanged. Snapshot: outputs/sandbox-projects/fieldwork-occurrences.json. Mechanical enum payloads are specified for later app integration.

Current approved baseline is the exact fieldwork-project (7).json. A one-time load imports it with browser backup and Undo. Occurrence source cutoffs: Teleport .995, Gift/Challenge .996, Certain Death .997. The challenge-before-gift two-branch contract is recorded in FIELDWORK-DIRECTION.md for future app/AI integration.

Language pass: strengthened all current variable descriptions, gradient poles, boolean states and enum descriptions. Use proportionate interpolation and preserve independent axes, presence masks and app mechanics in future AI prompts. Local draft receives a one-time prose-only update with backup/Undo. Reviewed baseline retains snapshot-7 numerical data with the new wording. Export: outputs/sandbox-projects/fieldwork-language-palette.json.

Added Inside (Civilization), Underground (Biome) and Option (Occurrences). Inside requires civilization plus infrastructure; Underground excludes civilization footprint. Both use contour veins and tiny rough pockets, with binary output and no traversal changes. Option uses isolated .996 points; future choice and trait systems are specified, not executed. Current snapshot: outputs/sandbox-projects/fieldwork-interiors-options.json (41 variables).
