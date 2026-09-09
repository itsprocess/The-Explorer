# Token economy — September 9, 2026

The About dialog now explains exploration, encounters, personal mapping and rebirth in separate readable sections.

Generation changes preserve saved tiles and existing cache keys:
- Setting instructions reduced from 2,248 to 1,314 characters (42% smaller). This is a character measurement, not a live total-token benchmark.
- Setting definitions omit an unused pole only when every supplied cell lies near the opposite pole; mixed and intermediate values keep both.
- Encounter instructions include only applicable outcome types and shared-mark rules.
- Send keyed outcome leaves and challenge requirements once, without the duplicate occurrence tree or teleport destination coordinates.
- Request only applicable reward, badge, repeat and imprint fields. Normalize omitted empty fields for existing storage/resolution contracts; required reward and death metadata still validate before caching.

Validation: 26 focused non-generation tests, TypeScript checking and production build. No paid AI generation used for benchmarking. Actual token savings depend on the tile and provider output/reasoning; measure new-generation traces before promising a per-tile total.

No world reset, account changes, seed changes or regeneration of existing tiles.
