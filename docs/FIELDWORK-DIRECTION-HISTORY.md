# Fieldwork design history — superseded proposals

Historical discussion only. Consult FIELDWORK-DIRECTION.md for the current agreed specification. Earlier formulas, colors, masks and dependencies below must not override the approved current project.

# Fieldwork direction and working specification

## Purpose and baseline

Audit and rebuild variables, procedural algorithms, natural-language counterparts,
and eventually prompts in one editable sandbox before adopting a reviewed baseline
in The Explorer. The sandbox is separate from the game. It is not a second game
implementation. Source recipes remain inspectable and editable data.

The user-approved starting point for the Civilization study is
`C:/Users/elsof/Downloads/fieldwork-project (4).json`, including its revised Chasms.
Preserve its variables and noise stacks. The extended snapshot is
`web/outputs/sandbox-projects/fieldwork-civilization.json`.

## Agreed category boundaries

1. Biome: natural environmental components and deterministic exploration rules.
2. Civilization: inhabitation, culture, populations and affiliations.
3. Uniqueness / Variation: additional variation, to be designed later.
4. Occurrences: events and other occurrences, to be designed later.

Only Biome may affect traversability. Any active biome blocker blocks exploration;
passable fields do not override blockers. Civilization may read biome outputs, but
cannot influence traversal directly or through a blocking biome's dependencies.
Ocean, Void, Lakes/Ponds and binary Chasms currently block; River does not.

Every-cell and every-10-cell views are sampling resolutions. The coarse view can
miss or fragment narrow features; it does not change the underlying world.

## Agreed affiliation model

Faction, kingdom and religion options are abstract affiliations, not archetypes.
Slot 01 does not inherently mean mercantile, aggressive, good, evil or advanced.
Finite mechanical slots can support indefinitely many narrative identities.

Keep three concepts distinct:

- Mechanical affiliation: an abstract identifier used by rules and relationships.
- Local entity identity: a particular named group, polity or religion that persists
  across relevant cells and encounters.
- Narrative expression: names, customs, histories and descriptions supplied by AI
  and retained consistently for that entity.

Different local entities can share a mechanical affiliation. Sharing a slot does
not make them the same organization. A recurring entity should reuse its identity,
not receive a new name every time its cell is described.

The same design applies to statuses and items. Rules may make an item type heal a
status type, or make an affiliation grant protection from imprisonment by another.
These are explicit mechanical relationships. AI explains their local manifestation;
it must not invent incompatible mechanical effects.

Future integration should use stable, namespaced slot keys and explicit relation
tables across systems. Do not use AI-generated names or mutable array positions as
global mechanical identifiers. Define whether faction, kingdom and religion slots
share a registry or map through relationships before integrating their mechanics.

## Species homogeneity

One simple gradient describes how mixed the local inhabitants are:
low means intermingled populations; high means one dominant species or population.
Examples include only wolves or only the Gorlok tribe. It does not specify which
species, population size, hostility, intelligence or cultural advancement.

## First Civilization proposal (editable, not settled design)

| Variable | Initial construction | Meaning |
| --- | --- | --- |
| Civilization Density | 650×480-cell fBm, 65×50 Perlin clusters, lowland preference and ground masks | Concentration of organized habitation |
| Civilization Age / Continuity | Independent 1500×1100 fBm | Relative length of cultural continuity; not a date |
| Advancement | Independent 950×750 fBm | Technological knowledge and capability |
| Infrastructure Level | Independent 800×620 fBm with 90×70 Perlin concentrations | Physical extent of buildings, routes and constructed systems |
| Aggressiveness | 550×430 fBm with 80×65 local variation | Tendency toward coercion or confrontation |
| Commerce Activity | 430×340 fBm multiplied by 0.2 + 0.8 × density | Exchange activity, with a floor for itinerant trade |
| Wealth Level | 620×490 fBm, 15% mix toward commerce | Material abundance |
| Species Homogeneity | 350×280 fBm with 65×50 local variation | Mixed to uniform inhabitants |
| Faction Affiliation | 600×468 Perlin, eight enum bands | Abstract affiliation slots |
| Kingdom Affiliation | 1800×1404 Perlin, eight enum bands | Abstract affiliation slots |
| Religious Affiliation | 1100×858 Perlin, eight enum bands | Abstract affiliation slots |

Eight slots per affiliation is an initial review choice, not a fixed system limit.
Enum arrays, cutoffs, names and descriptors remain editable. Separate channels
produce independent affiliation patterns. Larger kingdom regions are a proposed
starting scale; no kingdom/faction/religion containment hierarchy is imposed.

The current enum implementation partitions a continuous scalar field. Its numeric
ordering is a sampling mechanism, not a rank, affinity or distance between slots.
Slot frequencies need not be equal; boundaries may form contour bands. Review
these patterns before deciding whether to add a categorical territory generator.
Current enum step IDs are local recipe identifiers, not a shared global registry.
The sandbox does not yet implement cross-system affiliation relationships.

Affiliation fields describe regional background and do not by themselves establish
a settlement or organization at every cell. Age can remain high in an abandoned
region. Advancement, age, aggression and species mixture are independent unless
the user explicitly adds relationships. Sparse civilization need not mean absent
animals. Entity presence, overlapping memberships, unaligned populations and
territorial continuity remain open design questions.

## Prompt and engine boundary

The intended flow is evaluated biome fields and traversal → natural-setting
composition → inhabitation/culture composition, with later categories added in
order. Whether these are separate AI calls or sections of one call remains open.
Computed mechanics are authoritative inputs to narrative generation.

This implementation adds editable Civilization recipes and review notes only.
It does not generate AI identities, call AI, modify game prompts, implement item or
status relationships, or publish a new game baseline. Those are later integration
steps after the fields and their language have been reviewed.

## Infrastructure and emergent combinations

Infrastructure is a separate Civilization gradient describing built extent, independent of population density, technological advancement, age and wealth. It does not imply active use or good condition, and does not affect traversal. Low density plus high infrastructure can support abandoned architecture; high density plus low advancement and high species homogeneity can support a bustling low-tech monoculture; high density plus extensive infrastructure can support a sprawling city. These are narrative possibilities from combinations, not hardcoded biome labels. Maintenance, abandonment and the technological origin of ruins are not separate implemented fields. Current advancement describes capability; it does not by itself establish the technology of a vanished builder.

## Civilization spatial pass: sparse sites and independent traits

This pass supersedes the earlier continuous density field and commerce/wealth coupling. Habitation uses three independently seeded bounded patch families: settlement envelopes 8–32 cells in 100-cell blocks (42% occupancy), hamlets 2–9 in 38-cell blocks (22%), and tiny sites 1–3 in 17-cell blocks (10%). A broad regional multiplier creates settlement gaps. Envelope diameters are source bounds, not exact occupied cell counts; overlapping families may join. Sub-cell placement can make the smallest sites disappear or occupy one cell.

Infrastructure has its own sparse 3–30-cell sites plus potential built space in inhabited pods, modulated by an independent 45×35-cell fBm. Zero built intensity can yield inhabited but lightly built sites; independent footprints permit ruins outside habitation. Existing biome water/void/chasm fields mask both footprints, with no reverse influence on traversal.

Civilization Footprint is the editable maximum of habitation and infrastructure. Age, advancement, wealth and affiliation fields use this presence footprint. Aggression, commerce and species homogeneity use habitation presence. A generic presence reference suppresses interpreted output outside its footprint, with explicit Absent state. It does not multiply the interior trait value: zero remains a real low pole, and the first enum slot remains a real affiliation. Raw signals remain inspectable. Presence references are included in dependency and traversal validation.

Continuous traits now use independent local/regional fields at approximately 45–180-cell scales, with 7–9-cell detail where present and stronger range expansion. Affiliation fields retain broad independent scales. They are abstract affiliation backgrounds visible only at sites, not connected territory or identity solvers. Traits have no density-to-commerce-to-wealth dependency; this permits combinations across independent axes, without claiming every possible combination must occur in any finite viewport.

The combined map is a footprint composite: dark means empty, amber inhabited only, blue built only, cream both. It is not an average of incompatible traits or enum indices. Inspect a cell for all Civilization outputs, including Absent states. Coarse sampling can miss one-cell sites; use Every cell for local sizes. Nothing generates actual streets or building layouts yet.

## Denser inhabitation and historical impact (current pass)

This supersedes the infrastructure-defined footprint above. Habitation now uses 48-cell settlement blocks at 75% occupancy, 20-cell hamlet blocks at 50%, and 10-cell tiny-site blocks at 25%, retaining approximately 1–32-cell source envelopes. Removed the large regional suppression multiplier.

Civilization Impact Footprint is the union of current habitation and independent textured 6–38-cell historical-impact blotches in 60-cell blocks at 65% occupancy. It does not depend on infrastructure or age strength. Civilization Impact Age means how far back local civilization impact reaches: recent to ancient origins. It is independent of current density and is not time since abandonment. All cultural fields, including infrastructure, use this footprint as an explicit presence mask. A recent abandoned built site, ancient abandoned built site, recent settlement and ancient settlement can all occur. Zero age is a present recent site, not absence.

Infrastructure is now an independent continuous field within the shared footprint, rather than defining its own presence area. At uninhabited sites, affiliations and cultural traits describe associated or former inhabitants; commerce values are potential or traces rather than evidence of current residents. Narrative composition must respect zero current density.

Non-human organized communities use the same Civilization Density and cultural fields as human communities. A separate terrestrial Animal Population field and Animal Species Homogeneity represent wildlife independently of civilization impact, with no infrastructure, faction or traversal implications. The combined Civilization map shows impact, not wildlife; inspect Animal Population separately. Wildlife does not automatically create a civilization footprint. Aquatic and flying populations remain outside this first land-animal proposal.

## River crossings and shared civilization constraint

River Crossing Barrier is a separate editable Biome boolean: local 6×8-cell Perlin (gain 2, offset −0.5) × interpreted River strength (gain 1.4) × bounded patches (6–10-cell diameters, 14-cell spacing, 85% occupancy), threshold 0.16. River geometry is retained and the River variable itself does not block; the derived barrier does. Stronger river values monotonically increase blocking, while isolated patches leave repeated crossing gaps. This is not a route-connectivity guarantee for the entire map, especially where other blockers overlap.

The project-level civilizationObeysTraversal setting defaults on in this migration. Every Civilization output, including impact, infrastructure and animal fields, becomes explicitly Absent on blocked cells. Raw source signals remain inspectable. The same biome blocking function drives both traversal and this global mask. Civilization cannot influence blocking biomes through reference or presence dependencies. A checkbox in Civilization makes the global sandbox constraint reviewable. An AI narrative cannot override it. Existing per-recipe masks may remain redundant but are preserved. Updated snapshot: outputs/sandbox-projects/fieldwork-river-crossings.json.

## River correction: blocked by default, relief exceptions

This replaces the intermittent-barrier recipe above. Every positive River cell starts blocked. River Crossing Relief uses isolated 8–14-cell noise patches at 20-cell spacing and 90% occupancy, multiplied by 1 − 0.65 × River, then thresholded at 0.25. Lower river values produce larger/more successful relief openings; strong river sections remain mostly blocked but can still have relief. The barrier is 1 minus interpreted relief, with River as its presence reference. No relief means blocked even for arbitrarily weak positive river values; zero River is absent and never blocked by this field. Both recipes remain editable and Civilization continues to obey the combined traversal map. Updated snapshot: outputs/sandbox-projects/fieldwork-river-relief.json.

### Wider relief openings

Relief source diameters double from 8–14 to 16–28 cells. Spacing increases from 20 to 30 cells, the minimum supported spacing for 28-cell isolated patches. Occupancy stays at 90%. A light 3×4-cell Perlin subtraction at weight 0.04 textures margins before river-strength modulation. Output cutoff and river-strength response are unchanged. Existing drafts double their authored patch diameters once and retain the barrier and other variables. These dimensions are source envelopes; thresholded openings are smaller and full-width crossings still depend on local river geometry. Snapshot: outputs/sandbox-projects/fieldwork-river-relief-wide.json.

## Reviewed sixth export and overall map

The sixth supplied export is imported once into the active browser draft, backing up the prior draft and offering Undo. All recipes, IDs and flags are preserved; four display colors change (cyan River, deeper green foliage, olive groundcover, neutral gray rock). The narrowed River band is 0.48–0.51. Its barrier subtracts 8×8 Perlin at gain 1.1 from a constant 1; no separate relief variable remains. The inactive reference string on that Perlin layer is ignored by generation.

Overall map is a display-only composition of altitude, groundcover, foliage, exposed rock and water. Black overrides everything at blocked cells. A Civilization checkbox overlays inhabited sites in amber/cream and historical-impact sites in purple; it changes rendering only, never generation or traversal. Other traits remain available in the cell inspector, rather than tinting the terrain ambiguously. Zooms remain every cell and every 10 cells. Updated export: outputs/sandbox-projects/fieldwork-overall-map.json.

### Overall-map color correction

Overall-map color is independent of traversability: oceans, lakes and rivers render blue, chasms alone render black, and Void retains violet. Civilization overlays render only on explorable cells. The traversal inspector and statistics still report the actual rules. Lakes already have positive-output blocking and remain nontraversable. This supersedes the earlier all-blockers-black display convention.

Overall-map clarification: both Void and Chasms render black. Water remains blue; traversal rules are unchanged.

## Organic Civilization patch boundaries

Habitation and impact patch sources now use Boundary roughness 0.85. Seeded Perlin sampled around the boundary at two scales varies each patch radius smoothly, producing asymmetric lobes and indentations within its original diameter envelope. Centers, occupancy, spacing, seeds and maximum diameters are preserved; occupied area can decrease as edges indent. Roughness 0 retains the original circular source exactly. This generic editable control is enabled only for Civilization Density and Civilization Impact Footprint in this pass. Biomes, rivers, crossings and wildlife recipes are untouched. Presence masks follow the reshaped fields. Snapshot: outputs/sandbox-projects/fieldwork-organic-civilization.json.
