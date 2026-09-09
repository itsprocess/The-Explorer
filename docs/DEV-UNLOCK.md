# Dev session unlock and encounter waiting

Dev access requires both the existing Sites owner identity and a secondary password, stored only as the Sites DEV_PASSWORD secret. Unlock is recorded on the current character session, survives page navigation/reload, and ends with logout or session expiration. New sessions are locked. The unlock endpoint is origin-checked and rate-limited. Dev inspection, warp, provider resume and image regeneration enforce the same server guard.

Wait dismisses an unresolved teleport or option without changing game state. The player may inspect the scene and edit personal markers; selecting a movement direction reopens the encounter. Server movement validation still rejects unresolved encounters. Give up remains on the profile. Teleport failures leave Continue usable for retry.

Migration 0028 adds a locked-by-default session column only. No wipe, seed change or account reset.
