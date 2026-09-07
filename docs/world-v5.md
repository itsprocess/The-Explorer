# World 5

The topology threshold rises from 0.45 to 0.49. The connected eight-cell grid and protected origin approach are unchanged. A 16,000-coordinate audit across four seeds measured blocked cells increasing from 27.1% to 37.8%.

Lethal traps use an independent 5% roll outside the safe approach, including traversable marine cells. Distance no longer reduces deaths near the origin. Actual lethal events measured 4.91% among traversable sampled cells, and 4.85% in the nearby sample. Rare portals/treasure retain priority; badge-based faction hostility can add character-specific deaths.

The 75th field, `scenery.unique_features`, uses one 17-cell Perlin field, thresholded at 0.63 for roughly 20% coverage. Zero means absent. Present values reserve a first-pass detail slot and request one modest physical distinction in the main scene and visual brief. The field never participates in event, reward, or hazard selection.

Only completed moves trigger feedback: a dismissible nine-second popup and short synthesized tone for an encounter or newly earned badges, including distance milestones. A death has its own descending tone. Ordinary arrivals, exhausted encounters, profile loads, and reloads do not replay feedback. The same visit ID cannot replay the notification. Sound can be muted; its preference stays on the device. Audio is unlocked on the movement gesture, and unavailable audio never prevents play. Reduced-motion preferences disable the popup animation.

Illustrations use GPT Image 2 at 1152×768, medium quality, still WebP and 3:2 landscape. These settings meet the [image API's size constraints](https://developers.openai.com/api/docs/guides/image-generation#size-and-quality-options). Text remains on Luna.

Migration 0006 resets generated world packages, history, claims, badges, and progress, preserving character names, password hashes and sessions. Characters return alive to origin. Retired image objects use the existing idempotent deletion receipts and are removed on the next package access.
