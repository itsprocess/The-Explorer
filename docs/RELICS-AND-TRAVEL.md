# Relics and travel

Distance is measured in cell units along the route, including teleport displacement
and fatal teleport travel. Returning after death starts a new life at zero distance
without adding a return jump. Lifetime totals survive death. Dev travel does not
alter the real character. Existing characters default missing counters to zero.

Relics are discoveries, not badges, inventory, statuses or powers. The separate
secret occurrence field uses independent isolated sparks. Its threshold accounts
for the nine-cell local-maximum filter: `(1 - cutoff^9) / 9` is the expected density,
so the relic threshold gives half the standalone teleport density. Actual finite
world counts and overlapping fatal encounters can differ. No sampling is needed.

Each character receives one count per relic location across all lives. Counts for
this life reset on rebirth; total counts and claims survive. The committed visit
stores what was discovered and the character identity, including when another
encounter shares that arrival. Public location records display these discoveries.
The nearby marker list includes a manually assigned Relic marker; peeks never
receive the occurrence field. The occupied scene and illustration depict its
manifestation in the setting's own tone. The celebration precedes pending choices
or teleport confirmation.

Options describe mutually exclusive responses to one dilemma. The first choice is
a neutral refusal; other choices retain assigned outcomes and the existing lethal
choice limit. Narration establishes action prerequisites and uses parallel,
complete imperative phrases without consequence spoilers.

The requested new seed is `the-stones-remember-your-footsteps`. Migration 0023
prepares an account-preserving world wipe using the existing gated image cleanup.
It preserves names, defining traits, passwords and sessions. It clears world
content and progress. This migration has been tested only in an in-memory database;
the owner confirmed Sites publication and this wipe on 2026-09-09.

Validation: TypeScript check, production build, focused travel/relic, encounter
reward, teleport, feedback, marker, history, fieldwork fixture, prompt payload and
reset tests. No paid generation or broad procedural sampling was performed.

Repair: occurrence-specific scene and setup instructions are included only for assigned outcome types. Neighbor continuity carries the committed setting and shared exit, never neighboring scene prose or encounter facts. Dev previews preserve all real progress counters. Migration 0024 clears contaminated world content and progress once, preserving accounts, sessions and defining traits; seed unchanged.
