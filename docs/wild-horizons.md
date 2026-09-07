# Wild Horizons

World 6 uses the new seed `the-explorer-wild-horizons-20260907`. The reset clears world packages, shared regional identities, visits, global claims, badges and progress. Names, password hashes and sessions remain; characters return alive to the safe origin. Retired images are deleted using receipts that retain their original seed namespace.

## Climate and terrain

The old fBm outputs clustered around the middle. Elevation now expands a 300-cell continental field by 3×; temperature expands a 160-cell field by 3.4× with an elevation lapse; moisture expands a warped 120-cell field by 3.5×. Values remain deterministic and bounded to 0–1, including genuine extremes. Gradients remain spatially continuous, with biome thresholds creating transitions between named conditions.

A 6,000-coordinate audit across three seeds found the 10th–90th percentile spans at roughly 0.12–0.89 elevation, 0.06–0.95 temperature, and 0.05–0.95 moisture. Among 3,731 traversable samples, climate included 680 snowbound, 443 cold, 1,175 temperate, 644 warm and 789 hot cells. Forest patches now distinguish snowy conifers, dense tropical jungle, dry woodland and broadleaf cover. Terrain and moisture support snowfields, polar gravel, alpine scree, hot deserts, steppes and lush lowlands. Ocean and enclosed-cavern summaries override inappropriate surface cover.

## Derived situations

A deterministic interpretation pass combines ratings with the actual four-direction topology before either text pass. It adds at most four grounded conditions: ridge traverses, turning ledges, sheltered pockets, natural crossings, alpine freezes, layered canopies, wet caverns, wind-polished surfaces, seasonal basins, winter settlements, reclaimed masonry and sea cliffs. These guide physical description; they do not invent exits or gameplay events. Shared opening geometry remains canonical on both sides.

## Historical records and transport

Event, consumed-event and hostility prose now uses third-person past tense with `{character_name}`. JSON schema descriptions and validation require the character placeholder and reject second-person wording. A failed scene validation receives one correction pass, reusing its saved earlier stages. Permanent scenery never claims a character visited before they actually entered.

An independent 6.2% transport roll runs outside the safe approach and excludes lethal-trap and treasure cells. Actual transport measured 5.57% of traversable audit cells, about one in eighteen. Possible mechanisms include caravan rides, chutes, animal hauling, moving platforms, great crows, aerial conveyances, ferries, currents and spatial folds. Water and overhead-space gates constrain suitable carriers. The transport event authorizes its incidental carrier without creating a permanent settlement or extra navigation route.

Destinations are deterministically chosen at varied distances and snapped to the connected eight-cell backbone, within coordinate limits and distinct from the departure point. One transport resolves per entry: landing does not immediately execute another encounter. Both departure and arrival receive visit records; the shared historical text includes the confirmed destination. Distance milestones include the landing distance. Idempotent retries cannot repeat the transfer or create duplicate records. Preloading still writes packages only and never transports or discovers a character.
