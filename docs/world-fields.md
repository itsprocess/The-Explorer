# World fields, version 6

The app computes 75 fields: twelve baseline conditions and 63 independently shaped features. Features can be exactly zero. Zero means absent, not an atmospheric hint. One means full strength, not a guarantee that a reward is available. Events and repeat rules remain app-owned. Each feature has its own recipe; sharing a noise primitive does not mean sharing a spatial distribution.

The deterministic audit samples 12000 widely spaced coordinates across three seeds. **28.2% have no special features.** Observed presence is a sample statistic, not a gameplay promise; very rare rolls can be absent from this sample. Roads and contour rivers are procedural shapes, not physical drainage or a road network solver.

| Field | Kind | Meaning, low → high | Observed presence | Derivation |
| --- | --- | --- | --- | --- |
| Elevation | baseline | low basin → high ridge | everywhere | expanded continental fBm, 300-cell wavelength |
| Temperature | baseline | freezing → hot | everywhere | expanded 160-cell thermal gradient minus elevation lapse |
| Moisture | baseline | dry → wet | everywhere | expanded warped 120-cell moisture field |
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
| Shoreline | feature | absent → a transition between land and open water | 2.96% | narrow shoreline band around the ocean threshold |
| Forest | feature | absent → dense trees | 18.66% | warped threshold islands minus cellular clearings; temperature gate |
| River | feature | absent → wide river channel | 5.19% | thin contour of blended 120/47-cell fields, sparse watershed mask |
| Lake | feature | absent → deep pool or lake | 0.17% | rare 6-cell basins in low terrain |
| Exposed molten material | feature | absent → molten geology exposed at the surface | 0.68% | high volcanic tail AND narrow fissure contour |
| Chasm | feature | absent → deep fissure | 0.63% | ridged fault line restricted to fractured districts |
| Decomposer growth | feature | absent → a colony of decomposing life adapted to this climate | 1.92% | moist underground pockets with subtractive local noise |
| Animal aggregation | feature | absent → a gathering of local animal life | 0.34% | small occupied grazing clusters outside forest |
| Breeding habitat | feature | absent → a place where local life reproduces or raises young | 1.13% | isolated 1-in-90 sites, amplified by tree cover |
| Habitation | feature | absent → a permanent community adapted to this place | 0.44% | isolated 1-in-400 outposts plus rare 3-cell settlement centers |
| Overland route | feature | absent → a maintained route for overland movement | 3.23% | broken contour routes across inhabited districts |
| Temporary occupation | feature | absent → a temporary inhabited site | 0.8% | 1-in-130 single-cell camps, biased toward roads |
| Food production | feature | absent → land or structures used to produce food | 0.31% | small agricultural halo around settlement centers, broken into plots |
| Devotion | feature | absent → a place devoted to worship or spiritual practice | 0.34% | isolated shrines with extra sites along roads |
| Resource extraction | feature | absent → a site where useful raw material is removed | 0.4% | single entrances gated by regional ore veins |
| Fabrication | feature | absent → a site where materials are transformed into useful things | 0.19% | settlement-only occupancy roll |
| Commerce | feature | absent → a place organized around trade and exchange | 0.04% | town centers only, excluding small outposts |
| Abandoned habitation | feature | absent → physical remains of a former inhabited place | 0.85% | eroded 5-cell archaeological clusters |
| Conflict legacy | feature | absent → landscape-scale evidence of past conflict | 0.07% | rare elongated scar with finite length |
| Care of the dead | feature | absent → a place where a culture tends or houses its dead | 0.15% | isolated graves plus sparse ruin-associated burials |
| Automation | feature | absent → a functional apparatus working without constant manual effort | 0.2% | 1-in-600 points, independent of weather |
| Independent wayfarers | feature | absent → one or more beings traveling independently | 0.69% | rare single-cell encounter boosted by roads |
| Enforcement | feature | absent → local agents enforcing territorial rules | 0.1% | settlement or road gate AND independent patrol roll |
| Lethal danger | feature | absent → a lethal mechanism or environmental threat | 4.96% | independent roll, 5% independent lethal cells at every distance; safe-origin override |
| Windfall | feature | absent → a very rare concentration of unclaimed wealth | 0.07% | independent 1-in-2000 point, safe-origin override |
| Lingering presence | feature | absent → a trace of past life that remains perceptible | 0.03% | burial/ruin gate AND 1-in-80 spectral roll |
| Spatial connection | feature | absent → a connection between otherwise distant places | 0% | independent 1-in-a-million point, safe-origin override |
| Physical impossibility | feature | absent → a striking exception to the ordinary laws of this world | 0% | independent 1-in-a-million landmark; no implied reward |
| Drifting terrain | feature | absent → loose ground shaped into migrating ridges | 11.68% | dry-climate gate, threshold desert provinces with directional ripples |
| Moving ice | feature | absent → a persistent mass of slowly moving ice | 7.92% | cold-climate upper tail stretched along mountain valleys |
| Wetland | feature | absent → waterlogged terrain with climate-appropriate life | 6.08% | wet lowland mask with cellular dry islands |
| Elevated tableland | feature | absent → a raised level expanse with steep margins | 2.88% | terraced highland lobes with sharp threshold edges |
| Island mosaic | feature | absent → broken land distributed through open water | 0.73% | cellular island clusters inside ocean basins |
| Underwater habitat | feature | absent → a prominent living or accumulated structure beneath shallow water | 2.03% | shallow ocean band AND broken cellular reef rim |
| Falling water | feature | absent → water descending over an abrupt terrain change | 2.77% | river presence AND steep local elevation gradient |
| Evaporative deposits | feature | absent → flat mineral-rich ground left by vanished water | 2.77% | dry lowland basins, flattened threshold interiors |
| Geothermal activity | feature | absent → heated groundwater emerging at the surface | 0.04% | rare geothermal centers with short 2-cell radii |
| Mineral growth | feature | absent → conspicuous naturally grown mineral structures | 1.88% | underground mineral veins cut by a narrow contour mask |
| Sculpted outcrop | feature | absent → large exposed rock shaped into distinctive repeated forms | 2.31% | volcanic district AND cellular outcrop cores |
| Dense understory | feature | absent → a patch of dense tall non-tree vegetation | 1.92% | warm wet pockets with fine subtractive gaps |
| Botanical disproportion | feature | absent → local plant life with unusual scale or proportions | 0.05% | forest gate AND 1-in-700 botanical exception |
| Managed perennial growth | feature | absent → long-lived cultivated vegetation beyond a community | 0.15% | settlement hinterland rings with broken planted plots |
| Defense | feature | absent → structures intended to protect a place from intrusion | 0.02% | rare 2-cell defensive sites along road districts |
| Knowledge preservation | feature | absent → a place devoted to retaining and transmitting knowledge | 0.08% | inhabited/ruined site gate AND independent 1-in-25 roll |
| Measurement | feature | absent → a place built to observe and measure natural phenomena | 0.02% | rare exposed highland point sites |
| Waterborne transit | feature | absent → an interface for movement between land and water | 0.03% | coastal gate AND sparse dockyard clusters |
| Material storage | feature | absent → a substantial site where bulk materials are held | 0.1% | isolated industrial basins with 3-cell footprints |
| Utility distribution | feature | absent → a linear system carrying a useful resource across a district | 0.24% | thin contour arcs confined to developed provinces |
| Engineered crossing | feature | absent → a structure spanning a physical obstacle | 0.43% | river/chasm gate AND local independent construction roll |
| Aesthetic cultivation | feature | absent → a place where living things are arranged for beauty | 0.07% | rare courtyard-scale oases with irregular edges |
| Public assembly | feature | absent → a place designed to bring a community together | 0.03% | rare human-imprint point, independent of weather |
| Confinement | feature | absent → a place intended to contain or isolate its occupants | 0% | fortification-associated sites plus exceptionally isolated cells |
| Coordinated migration | feature | absent → a group moving together along an established route | 0.08% | road-only 1-in-48 procession sites |
| Failed journey | feature | absent → substantial remains of a journey that did not finish | 0.13% | coastal/deep-water rare points, smaller land chance |
| Deep-time life | feature | absent → visible preserved evidence of ancient organisms | 0.03% | old terrain gate AND small sedimentary clusters |
| Exceptional organism | feature | absent → a single conspicuously large form of local life | 0.07% | independent 1-in-2500 sighting, form left to the setting |
| Defiance of weight | feature | absent → matter supported in a way ordinary gravity cannot explain | 0.01% | gravity-distortion gate AND rare 2-cell anomaly core |
| Transformed surface | feature | absent → terrain visibly altered by an extreme past process | 0.25% | rare heat-scar provinces with subtractive erosion |
| Sudden impact | feature | absent → a landscape scar left by a violent external collision | 0.02% | isolated 4-cell circular impact basins |
| Optical anomaly | feature | absent → a persistent local distortion of visible appearance | 0.18% | dry district AND narrow heat-band AND rare local roll |
| Unique features | feature | absent → one modest distinctive detail | 19.68% | single 17-cell Perlin field, upper fifth only; scenery without events |
| Commemoration | feature | absent → a prominent work intended to preserve a memory | 0.03% | rare point monuments in ancient provinces |

The Dev view shows actual present features first, baseline conditions separately, and absent features collapsed. Percentages indicate feature strength or position between the stated baseline meanings. They are not probabilities.

Cell topology retains its connected grid backbone. Shared exits are determined symmetrically from both endpoints and describe openings with broad terrain glimpses, never hidden contents of the next cell. Shared kingdom/faction/religion identities cover larger territories but do not imply settlements or patrols in every cell. Foreign-badge enforcement requires an actual patrol.

Run npx tsx scripts/audit-world.ts to reproduce the report. Recipe changes require a world version change or an explicit development reset; saved prose is never silently regenerated.
