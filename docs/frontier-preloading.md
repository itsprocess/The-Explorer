> Superseded: speculative preloading is now disabled. See [current generation behavior](token-efficiency.md#foreground-reliability-update). The design below documents the earlier implementation.

# Frontier preloading

This update retains `world-5`, all existing packages, images, characters, visits and claims. No reset migration runs. Changed prompts and encounter selection apply only when a cell is first generated; saved cells keep their canonical outcomes.

Entering or loading a living character's location starts independent text requests for every available cardinal exit. These requests use the normal persisted generation leases and stages. The current image request remains independent. Once it is ready and neighbor text requests settle, up to two neighboring image requests run concurrently. Background failures remain silent and can be recovered by ordinary on-demand generation. Moving away stops queuing additional background images; already-started requests can finish caching.

The authenticated preload endpoint accepts only the character's current position, an available direction and a text/image stage. It returns readiness only. It never calls arrival resolution, creates visits, claims global events, awards badges, or updates characters. Visited coordinates, rather than completed generation packages, drive discovered map markings. Public location and image routes reject coordinates without visits. Owner diagnostics can still inspect cached packages without discovering them.

Movement continues to commit only after its text and automatic outcome are available, preserving atomic movement and idempotent retries. The existing cell remains visible during this asynchronous request; the loading indicator occupies its image area. No loading banner appears above the map, in a heading, or in the diagnostics panel.

New illustrations use GPT Image 2 at 1008×672, low quality, WebP. Existing illustrations are retained. Benign interactions now have 56 open-ended categories and an ordinary-cell probability of 25%, rising to 30% around active natural/mechanical subjects and 38% around people. Higher-priority deaths and rare outcomes still take precedence, so ordinary benign interaction outcomes occur slightly less than one quarter of cells. These add a short ongoing circumstance to the saved scene and an automatic arrival narrative, without new choices, inventory, rewards or invented hazards.
