# World fields, version 2

The app computes 33 fields: six baseline conditions and 27 independently shaped features. Features can be exactly zero. Zero means absent, not an atmospheric hint. One means full strength, not a guarantee that a reward is available. Events and repeat rules remain app-owned. Each feature has its own recipe; sharing a noise primitive does not mean sharing a spatial distribution.

The deterministic audit samples 12000 widely spaced coordinates across three seeds. **61.3% have no special features.** Observed presence is a sample statistic, not a gameplay promise; very rare rolls can be absent from this sample. Roads and contour rivers are procedural shapes, not physical drainage or a road network solver.

| Field | Kind | Meaning, low → high | Observed presence | Derivation |
| --- | --- | --- | --- | --- |
| Elevation | baseline | low basin → high ridge | everywhere | continental fBm, 600-cell wavelength |
| Temperature | baseline | freezing → hot | everywhere | 400-cell climate gradient minus elevation lapse |
| Moisture | baseline | dry → wet | everywhere | warped 230-cell moisture field |
| Space | baseline | tight passage → wide clearing or hall | everywhere | squared local fBm, mostly modest spaces |
| Enclosure | baseline | open sky → underground | everywhere | thresholded 90-cell rock roof with eroded margins |
| Stability | baseline | broken ground or masonry → sound ground or masonry | everywhere | inverse fourth-power fracture field, usually high |
| Forest | feature | absent → dense trees | 21.44% | warped threshold islands minus cellular clearings; temperature gate |
| River | feature | absent → wide river channel | 5.68% | thin contour of blended 120/47-cell fields, sparse watershed mask |
| Lake | feature | absent → deep pool or lake | 0.21% | rare 6-cell basins in low terrain |
| Lava | feature | absent → exposed lava | 0.77% | high volcanic tail AND narrow fissure contour |
| Chasm | feature | absent → deep fissure | 0.7% | ridged fault line restricted to fractured districts |
| Fungal colony | feature | absent → large fungal colony | 1.68% | moist underground pockets with subtractive local noise |
| Herd | feature | absent → large herd | 0.38% | small occupied grazing clusters outside forest |
| Nest | feature | absent → large occupied nest | 1.22% | isolated 1-in-90 sites, amplified by tree cover |
| Settlement | feature | absent → compact town | 0.49% | isolated 1-in-400 outposts plus rare 3-cell settlement centers |
| Road | feature | absent → paved route | 3.38% | broken contour routes across inhabited districts |
| Camp | feature | absent → occupied camp | 0.71% | 1-in-150 single-cell camps, biased toward roads |
| Farm | feature | absent → cultivated plot | 0.32% | small agricultural halo around settlement centers, broken into plots |
| Shrine | feature | absent → maintained shrine | 0.37% | isolated shrines with extra sites along roads |
| Mine | feature | absent → working mine | 0.41% | single entrances gated by regional ore veins |
| Workshop | feature | absent → working craft shop | 0.19% | settlement-only occupancy roll |
| Market | feature | absent → busy market | 0.05% | town centers only, excluding small outposts |
| Ruins | feature | absent → substantial ruined buildings | 0.92% | eroded 5-cell archaeological clusters |
| Battlefield | feature | absent → visible battlefield remains | 0.07% | rare elongated scar with finite length |
| Burial site | feature | absent → cemetery | 0.18% | isolated graves plus sparse ruin-associated burials |
| Machinery | feature | absent → large functional machine | 0.23% | 1-in-600 points, independent of weather |
| Traveler | feature | absent → traveling group | 0.63% | rare single-cell encounter boosted by roads |
| Patrol | feature | absent → armed patrol | 0.1% | settlement or road gate AND independent patrol roll |
| Lethal trap | feature | absent → active trap | 5.92% | independent roll, 2% nearby rising toward 6% far away; safe-origin override |
| Treasure chest | feature | absent → rare treasure chest | 0.07% | independent 1-in-2000 point, safe-origin override |
| Haunting | feature | absent → visible haunting | 0.03% | burial/ruin gate AND 1-in-80 spectral roll |
| Portal | feature | absent → active portal | 0% | independent 1-in-a-million point, safe-origin override |
| Impossible landmark | feature | absent → impossible landmark | 0% | independent 1-in-a-million landmark; no implied reward |

The Dev view shows actual present features first, baseline conditions separately, and absent features collapsed. Percentages indicate feature strength or position between the stated baseline meanings. They are not probabilities.

Cell topology retains its connected grid backbone. Shared exits are determined symmetrically from both endpoints and describe openings, never the contents of the next cell. Shared kingdom/faction/religion identities cover larger territories but do not imply settlements or patrols in every cell. Foreign-badge enforcement requires an actual patrol.

Run npx tsx scripts/audit-world.ts to reproduce the report. Recipe changes require a world version change or an explicit development reset; saved prose is never silently regenerated.
