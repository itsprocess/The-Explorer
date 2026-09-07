# World fields, version 3

The app computes 74 fields: twelve baseline conditions and 62 independently shaped features. Features can be exactly zero. Zero means absent, not an atmospheric hint. One means full strength, not a guarantee that a reward is available. Events and repeat rules remain app-owned. Each feature has its own recipe; sharing a noise primitive does not mean sharing a spatial distribution.

The deterministic audit samples 12000 widely spaced coordinates across three seeds. **41.5% have no special features.** Observed presence is a sample statistic, not a gameplay promise; very rare rolls can be absent from this sample. Roads and contour rivers are procedural shapes, not physical drainage or a road network solver.

| Field | Kind | Meaning, low → high | Observed presence | Derivation |
| --- | --- | --- | --- | --- |
| Elevation | baseline | low basin → high ridge | everywhere | continental fBm, 600-cell wavelength |
| Temperature | baseline | freezing → hot | everywhere | 400-cell climate gradient minus elevation lapse |
| Moisture | baseline | dry → wet | everywhere | warped 230-cell moisture field |
| Space | baseline | tight passage → wide clearing or hall | everywhere | squared local fBm, mostly modest spaces |
| Enclosure | baseline | open sky → underground | everywhere | thresholded 90-cell rock roof with eroded margins |
| Stability | baseline | broken ground or masonry → sound ground or masonry | everywhere | inverse fourth-power fracture field, usually high |
| Visible age | baseline | recently formed or made → ancient and weathered | everywhere | 180-cell age provinces with squared antiquity tail |
| Light | baseline | dim → bright | everywhere | roof-dependent daylight plus sparse subterranean glow |
| Wind | baseline | still → strong wind | everywhere | squared 65-cell gust field attenuated by enclosure |
| Gravity | baseline | light pull → heavy pull | everywhere | usually normal; rare broad gravity-distortion lobes |
| Human imprint | baseline | untouched → long-shaped by people | everywhere | cubic 210-cell historical influence field |
| Strangeness | baseline | ordinary → unfamiliar forms and materials | everywhere | sixth-power 110-cell anomaly field, usually near zero |
| Ocean | feature | absent → deep open ocean | 12.57% | warped 650-cell basins with 95-cell coastal roughness; dry origin buffer |
| Coast | feature | absent → wide tidal shore | 2.96% | narrow shoreline band around the ocean threshold |
| Forest | feature | absent → dense trees | 19.58% | warped threshold islands minus cellular clearings; temperature gate |
| River | feature | absent → wide river channel | 5.19% | thin contour of blended 120/47-cell fields, sparse watershed mask |
| Lake | feature | absent → deep pool or lake | 0.18% | rare 6-cell basins in low terrain |
| Lava | feature | absent → exposed lava | 0.68% | high volcanic tail AND narrow fissure contour |
| Chasm | feature | absent → deep fissure | 0.63% | ridged fault line restricted to fractured districts |
| Fungal colony | feature | absent → large fungal colony | 1.49% | moist underground pockets with subtractive local noise |
| Herd | feature | absent → large herd | 0.33% | small occupied grazing clusters outside forest |
| Nest | feature | absent → large occupied nest | 1.13% | isolated 1-in-90 sites, amplified by tree cover |
| Settlement | feature | absent → compact town | 0.44% | isolated 1-in-400 outposts plus rare 3-cell settlement centers |
| Road | feature | absent → paved route | 3.23% | broken contour routes across inhabited districts |
| Camp | feature | absent → occupied camp | 0.65% | 1-in-150 single-cell camps, biased toward roads |
| Farm | feature | absent → cultivated plot | 0.31% | small agricultural halo around settlement centers, broken into plots |
| Shrine | feature | absent → maintained shrine | 0.34% | isolated shrines with extra sites along roads |
| Mine | feature | absent → working mine | 0.4% | single entrances gated by regional ore veins |
| Workshop | feature | absent → working craft shop | 0.19% | settlement-only occupancy roll |
| Market | feature | absent → busy market | 0.04% | town centers only, excluding small outposts |
| Ruins | feature | absent → substantial ruined buildings | 0.85% | eroded 5-cell archaeological clusters |
| Battlefield | feature | absent → visible battlefield remains | 0.07% | rare elongated scar with finite length |
| Burial site | feature | absent → cemetery | 0.15% | isolated graves plus sparse ruin-associated burials |
| Machinery | feature | absent → large functional machine | 0.2% | 1-in-600 points, independent of weather |
| Traveler | feature | absent → traveling group | 0.58% | rare single-cell encounter boosted by roads |
| Patrol | feature | absent → armed patrol | 0.1% | settlement or road gate AND independent patrol roll |
| Lethal trap | feature | absent → active trap | 5.35% | independent roll, 2% nearby rising toward 6% far away; safe-origin override |
| Treasure chest | feature | absent → rare treasure chest | 0.07% | independent 1-in-2000 point, safe-origin override |
| Haunting | feature | absent → visible haunting | 0.03% | burial/ruin gate AND 1-in-80 spectral roll |
| Portal | feature | absent → active portal | 0% | independent 1-in-a-million point, safe-origin override |
| Impossible landmark | feature | absent → impossible landmark | 0% | independent 1-in-a-million landmark; no implied reward |
| Dunes | feature | absent → large dune field | 7.08% | dry-climate gate, threshold desert provinces with directional ripples |
| Glacier | feature | absent → thick glacier | 1.23% | cold-climate upper tail stretched along mountain valleys |
| Marsh | feature | absent → deep wetland | 4.26% | wet lowland mask with cellular dry islands |
| Mesa | feature | absent → flat-topped plateau | 2.16% | terraced highland lobes with sharp threshold edges |
| Archipelago | feature | absent → cluster of islands | 0.73% | cellular island clusters inside ocean basins |
| Reef | feature | absent → extensive reef | 2.03% | shallow ocean band AND broken cellular reef rim |
| Waterfall | feature | absent → high waterfall | 2.77% | river presence AND steep local elevation gradient |
| Salt flat | feature | absent → broad salt pan | 0.68% | dry lowland basins, flattened threshold interiors |
| Geyser | feature | absent → active geyser field | 0.04% | rare geothermal centers with short 2-cell radii |
| Crystal formation | feature | absent → large crystal formations | 1.88% | underground mineral veins cut by a narrow contour mask |
| Columnar rock | feature | absent → columnar rock formation | 2.31% | volcanic district AND cellular outcrop cores |
| Reed or bamboo grove | feature | absent → tall cane grove | 1.05% | warm wet pockets with fine subtractive gaps |
| Giant growth | feature | absent → oversized local flora | 0.03% | forest gate AND 1-in-700 botanical exception |
| Orchard | feature | absent → old cultivated grove | 0.15% | settlement hinterland rings with broken planted plots |
| Fortification | feature | absent → substantial fortification | 0.02% | rare 2-cell defensive sites along road districts |
| Archive or library | feature | absent → collection of preserved knowledge | 0.08% | inhabited/ruined site gate AND independent 1-in-25 roll |
| Observatory | feature | absent → astronomical structure | 0.02% | rare exposed highland point sites |
| Harbor | feature | absent → working harbor | 0.03% | coastal gate AND sparse dockyard clusters |
| Quarry | feature | absent → worked excavation | 0.1% | isolated industrial basins with 3-cell footprints |
| Aqueduct | feature | absent → raised water conduit | 0.24% | thin contour arcs confined to developed provinces |
| Bridge remains | feature | absent → substantial bridge structure | 0.43% | river/chasm gate AND local independent construction roll |
| Designed garden | feature | absent → formal or abandoned garden | 0.07% | rare courtyard-scale oases with irregular edges |
| Arena | feature | absent → gathering or contest ground | 0.03% | rare human-imprint point, independent of weather |
| Confinement site | feature | absent → old or active confinement structure | 0% | fortification-associated sites plus exceptionally isolated cells |
| Caravan | feature | absent → traveling convoy | 0.06% | road-only 1-in-55 procession sites |
| Wreckage | feature | absent → substantial wreckage | 0.13% | coastal/deep-water rare points, smaller land chance |
| Fossil bed | feature | absent → exposed ancient remains | 0.03% | old terrain gate AND small sedimentary clusters |
| Great creature | feature | absent → very large creature | 0.07% | independent 1-in-2500 sighting, form left to the setting |
| Suspended matter | feature | absent → floating rocks or structures | 0.01% | gravity-distortion gate AND rare 2-cell anomaly core |
| Vitrified ground | feature | absent → glasslike landscape | 0.25% | rare heat-scar provinces with subtractive erosion |
| Impact site | feature | absent → impact crater | 0.02% | isolated 4-cell circular impact basins |
| Persistent mirage | feature | absent → unusual visual phenomenon | 0.04% | dry district AND narrow heat-band AND rare local roll |
| Standing monument | feature | absent → large standing monument | 0.03% | rare point monuments in ancient provinces |

The Dev view shows actual present features first, baseline conditions separately, and absent features collapsed. Percentages indicate feature strength or position between the stated baseline meanings. They are not probabilities.

Cell topology retains its connected grid backbone. Shared exits are determined symmetrically from both endpoints and describe openings with broad terrain glimpses, never hidden contents of the next cell. Shared kingdom/faction/religion identities cover larger territories but do not imply settlements or patrols in every cell. Foreign-badge enforcement requires an actual patrol.

Run npx tsx scripts/audit-world.ts to reproduce the report. Recipe changes require a world version change or an explicit development reset; saved prose is never silently regenerated.
