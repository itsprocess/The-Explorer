# World controls on the portable Node deployment

Sign in through the outer gate as admin, then open Dev > World Administration.
Wipe World requires typing WIPE WORLD and never deletes accounts or sessions.
It clears generated packages, image files, visits/history, event claims, provider
jobs/usage, world statistics, badges, traits and character progress. Characters
retain their IDs, owners and names, return alive to (0,0), and keep their password
hashes and sessions. Concurrent requests and unexpired generation leases block it.
The operation is for a single Node app process, as required by this SQLite deployment.

Set WORLD_SEED as a hosting environment variable/secret. Restart after changing
it (no build or source changes). Existing worlds keep their recorded seed until
the administrator explicitly resets them; Dev reports when a new seed is pending.
On an empty installation, WORLD_SEED is used immediately. If unset, the existing
configured seed remains the fallback so installing this update does not wipe or
replace an existing world. Each reset gets a separate namespace even with the
same seed. The endpoint does not return the seed value.

This control does not make ephemeral hosting storage durable. Accounts survive
this reset operation, but cannot survive loss of the underlying SQLite volume.
Confirm persistent storage with the host before relying on accounts across redeploys.
The reset control is implemented by the portable Node launcher, not the Sites Worker.
