# Crosscurrents

World seed: `the-explorer-crosscurrents-20260907`, generator version `world-7`.

## Generation and concurrency

All OpenAI writing and illustration calls pass through the D1-backed `generation_jobs` queue. A seed/version-scoped SHA-256 request ID deduplicates equivalent provider inputs. Rows contain the request, stage lane, cell scope, priority, attempts, lease, status, error and completed response receipt. Image receipts contain R2 metadata, never base64 image bodies or API keys. Canonical packages retain their existing compare-and-swap protection.

One atomic SQL claim limits running provider calls across Worker isolates: 12 text and 6 image calls, with background work limited to 10 and 4 respectively. The remaining capacity is reserved for foreground exploration. Recent queued foreground work takes precedence, and entering a preloading cell promotes already queued work for that cell. Active calls renew 90-second leases every 20 seconds; abandoned work can be reclaimed. Completed receipts are reused if a later package publication was interrupted. Provider failures have a shared per-job cooldown rather than triggering duplicate retry storms.

Every available cardinal neighbor begins a separate text → art pipeline immediately on arrival. Its image begins as soon as its own text completes; it does not wait for sibling text or the current image. The four chains run concurrently within the global capacity limits. Two players targeting the same place share the existing package and provider claims. Preloading still writes no visit, encounter claim, character update, badge, or public discovery.

Game, image and preload endpoints negotiate newline-delimited JSON streams. Packets are `accepted`, `heartbeat`, optional `stage`, and a terminal `complete` or `error`. Early acceptance and periodic packets keep long provider waits in a live HTTP response. Existing callers without the stream Accept header retain JSON responses. The client parses fragmented packets and detects a connection ending before completion. Responses never expose undiscovered content through preload packets.

This hosting environment provides D1 and R2, not a separately provisioned queue consumer. Execution is **request-driven**: streams keep jobs alive while connected; when all clients disconnect, in-flight execution may be terminated, and later requests resume saved stages after lease expiry. This is not an always-on daemon or a guarantee of unlimited parallelism. A dedicated Cloudflare Queue/Workflow consumer is the next infrastructure step if completion while every browser is closed becomes a requirement. See [Cloudflare request lifetime limits](https://developers.cloudflare.com/workers/platform/limits/).

## Generation vocabulary

There are still 12 baselines, 63 feature categories, and 56 benign encounter categories. Geographic fields retain meaningful shapes and climate constraints. Specific authored objects become functional domains: devotion, commemoration, measurement, knowledge preservation, extraction, fabrication, material storage, defense, confinement, and others. Encounters describe dynamics such as reciprocity, identity, adaptation, scarcity, and self-organization; the writer supplies participants and physical expression. Stable legacy field IDs address procedural algorithms and must not prescribe literal objects. Event outcomes and repeat rules remain app-owned.

## Interface and reset

Exit rows align the direction with a readable description; terrain hints sit beneath, and separators distinguish routes. Blocked directions use the same structure. A person icon identifies player history in the game and shared location record. About opens a keyboard-accessible modal describing play, automatic encounters, persistent identity and read-only sharing.

The reset removes generated packages, queue receipts, visits and claims, and resets character progress to a living origin arrival. Names and password hashes remain. Retired R2 illustrations are queued for deletion on the next package access.

## Verification

33 automated tests cover procedural rules, queue capacity and priority, stale and duplicate claims, streaming packet fragmentation and incomplete responses, and loading reveal behavior. A local real-provider smoke run opened six concurrent streams for two players (four neighbors, one duplicate neighbor, one current image). All were accepted within 210 ms; the current illustration completed in 22.7 seconds and all neighbors in 31.9 seconds. One neighbor already had cached text. D1 contained exactly five completed image jobs and every provider job had one attempt. Snapshots confirmed neither player's position, history nor discovered map changed. These are one local run's timings, not a production latency or large-scale load guarantee.
