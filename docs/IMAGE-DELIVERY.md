# Image delivery and request ownership

Images use a stable world/coordinate R2 key: namespace + illustrations/x/y.webp. The SQL package index retains the exact object key for older images. Reads first reuse that index, then HEAD the deterministic key if the index is absent, covering an upload that completed before SQL publication. Existing saved images return before provider readiness or any generation call.

Only initial cell creation schedules the first image. A SQL insert-once receipt prevents repeated attempts. Snapshot reads, ordinary refresh and image delivery never schedule generation. GET /api/image is a read-only current-cell status endpoint. Pending status uses active package/job leases and the short initial queue receipt; stale or failed work becomes missing and exposes a refresh-only control. Saved images render directly, without being hidden by unrelated busy state.

Dev alone can explicitly POST force=true to regenerate; authorization is checked server-side and a per-cell SQL lease prevents duplicate Dev requests. The old image remains available until its replacement is uploaded. No world reset, seed change or account changes.
