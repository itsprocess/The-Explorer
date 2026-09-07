# Teleport confirmation, community, and distance

This update does not change the world seed, package namespace or navigability. Existing cells, images, claims, badges and characters remain intact. Only an additive presence-table migration runs. New cells receive the revised procedural inputs; cached cells retain their original packages and events.

## Teleports

Entry commits the character at the source and stores a pending transport token, destination and canonical historical narrative in the character record. Its history records only the source arrival, not a completed journey. A modal appears after the source cell is fully loaded and says OK will transport the player. The server rejects directional movement while a transfer is pending. Reloading retains the pending state.

OK sends a dedicated confirmation with the pending token and an idempotency request ID. A revision-guarded transaction transfers position, records the completed source encounter and destination arrival, and awards distance milestones exactly once. It does not immediately chain destination encounters. Pending global/per-character events are reserved at source entry using the existing repeat rules.

While confirmation is pending, preload prepares the saved destination instead of unnecessary source neighbors, with foreground priority. This creates no visit, event, badge or presence at the destination. Hovering or focusing an ordinary movement button promotes that neighbor's queued generation. The exit descriptions now have the same movement actions as the compass; read-only shared pages have no movement buttons.

## Players and server statistics

The right panel polls every 20 seconds while the page is visible. Recently active means a heartbeat within 90 seconds. Presence joins current character coordinates, so departure immediately removes a character from that tile's results; abandoned tabs expire. The API authenticates a character and rejects coordinates other than their current cell. It returns no neighboring player information. The current player is excluded from the list. Names link to existing public profiles.

Global counts are distinct coordinates in visits (not generated packages), summed character death counters, maximum character furthest distance, and characters with furthest distance above zero. Thus origin-only registrations do not inflate explorer count, and returning after death does not remove an explorer.

## Distance curve

For radial distance `r`, let `d=max(0,r-32)`. Intensity is `0.22*d/(d+600) + 0.38*d/(d+8000) + 0.40*d/(d+100000)`. It is zero in the first 32 cells, approximately 0.026 at 100, 0.12 at 500, 0.37 at 5,000, and continues smoothly toward 1 without a hard cutoff.

Independent feature rolls scale up to 3×, treasure up to 6×, and exceptionally rare marvel/portal rolls up to 100× (still rare). Occupied centers scale up to 1.8×. Present graded features strengthen up to 1.5×. Temperature and humidity deviations widen slightly while keeping their regional fields. Strangeness grows with distance and regional noise; gravity exceptions occupy more far districts. Unique scenery thresholds gradually admit more cells. Benign encounters scale up to 2× with a 65% ceiling; transport chance scales up to 1.7×. The origin safety override remains absolute. Transport distances have a long tail: most are short, but rare transfers reach thousands or hundreds of thousands of cells.

## Images and validation

The image model, art prompt, dimensions, quality, and WebP output are unchanged. At 1008×672 (677,376 pixels), the current landscape size is already close to GPT Image 2's documented 655,360-pixel minimum, and low is its fastest quality setting. Earlier destination preparation and likely-exit priority reduce waiting without changing the art. Partial-image streaming could show a preview sooner, but does not establish faster final completion and conflicts with the current full-cell reveal requirement. See [official image-generation documentation](https://developers.openai.com/api/docs/guides/image-generation).

Validation covers confirmation tokens, source persistence, idempotent transfer, exact-cell presence, inactive/neighbor exclusion, statistic definitions, and smooth distance escalation. HTTP/auth/D1 integration tests used local cached fixture cells because the configured OpenAI account returned `credit_balance_exhausted`; the app now identifies this correctly instead of calling it “busy.” No production fixture data or reset is included.
