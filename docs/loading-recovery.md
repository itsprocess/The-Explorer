# Loading incident repair

The reset preserved the character at origin while deleting every visit. The read-only image route correctly required a visit, but no path restored that initial visit for an existing character. Production logs showed `/api/image/0/0` returning 404 after successful generation, and the live visits table was empty. Snapshot now restores one initial arrival for an origin character with no history, preserving character state and every saved package.

Canceled preloads also left legacy ten-minute generation leases. Active jobs now renew a 90-second lease every 25 seconds; a silent abandoned job can be reclaimed after 90 seconds, including legacy locks with older timestamps. Token-checked publication still prevents competing writers from replacing a completed package. Independent regional naming runs concurrently but waits for all started jobs to settle before releasing its parent request.

Expected generation contention returns 202 with a pending code rather than a console full of 409 errors. Retries back off, have a bounded wait, and stop when their location view goes away. An already-started request can finish caching; canceled views do not keep issuing follow-up requests.

The image component distinguishes receiving a URL from successfully loading its bytes. It stays in the image placeholder until `onLoad`, and shows a compact retry on `onError` instead of a broken image occupying the entire frame. Retry reuses the existing illustration and bypasses stale delivery caching. Background illustrations begin only after the current image loads successfully.

The regression integration test deletes only its fixture character's origin visit, confirms exactly one restored arrival and successful WebP delivery, then simulates an old abandoned lock and verifies immediate reclaim without its old ten-minute expiry. No world reset or seed change is part of this repair.
