# Movement counters

The internal distanceLife/distanceTotal fields now hold integer move counts. Each completed normal move or confirmed teleport counts once regardless of distance, including fatal teleport arrivals. Returning after death starts a fresh life counter without adding a move. Choices, waiting, failed/retried requests and Dev travel add none. Furthest/current distance from origin retain geometric distance.

World Total Moves sums all character lifetime counts. Migration 0029 reconstructs existing totals from retained visit transitions, excluding return and same-cell choice records, and preserves old displacement values under legacyDistanceLife/legacyDistanceTotal. Historical same-cell portal arrivals count as moves; fatal transfers following pending transport also count. Old history lacks explicit action metadata, so reconstruction follows these recorded signals. No account, world, image or history deletion and no seed change.
