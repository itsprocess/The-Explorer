**Current GoDaddy workflow:** [Edit and publish](EDIT-AND-PUBLISH.md) supersedes the historical ZIP and initial-deployment instructions below. GitHub preview and live publication are now verified working.

# Private prototype: portable Node release

Use **Node.js hosting**, not a static upload or a PHP-only cPanel directory. This release runs a persistent Node process, SQLite, and ordinary image files. It does not need Cloudflare D1/R2, MySQL, Redis, or a separate generation worker. Multiple requests can await OpenAI concurrently; SQLite handles short transactional writes. Run **one application instance**, with one persistent local disk; do not put SQLite on a network share or launch replicas with independent disks.

## Selected address

The portable build is configured for `https://appliedcoordination.com/the-explorer/`: `hosting.publicOrigin` is `https://appliedcoordination.com` and `hosting.basePath` is `/the-explorer`. Links, API calls, images, framework assets, and character cookies use this prefix. Changing the prefix requires a rebuild.

GoDaddy must route `/the-explorer` and `/the-explorer/*` from the existing domain to the Node app, preserving the prefix and streaming responses. Uploading a Node app does not itself establish a subfolder route on an existing cPanel site. Confirm path-based routing/reverse-proxy support with GoDaddy before connecting the domain; do not repoint the main domain away from its current website. The account�s cPanel Application Manager exposes Base Application URL, and `/the-explorer` has been selected. The deployed route has not been tested yet. Keep the password gate even with an unlisted path.

## Install and start

Requirements: Node **22.13 or later**, writable persistent disk, outbound HTTPS to OpenAI, and an HTTPS domain/reverse proxy. Use the latest patched compatible Node 22 release. SQLite is built into Node; an experimental SQLite warning on some Node versions is expected.

1. Unzip `the-explorer-node.zip` into a private application directory, outside `public_html` or other static document roots.
2. Edit **`explorer.config.json`**. Set `hosting.publicOrigin` to the exact HTTPS origin, e.g. `https://explorer.example.com`. Set `hosting.dataDirectory` to persistent storage that survives deployments, preferably an absolute path outside the replaceable application release directory. All runtime data lives beneath that one directory.
3. Set these **server secrets** in the hosting dashboard, or an ignored `.env.local` next to `package.json` for local use:

   ```dotenv
   OPENAI_API_KEY=your-api-key
   EXPLORER_ACCESS_PASSWORD=a-unique-random-password-at-least-24-characters
   EXPLORER_ADMIN_PASSWORD=a-different-random-password-at-least-24-characters
   ```

   Use independently generated passwords, not those example strings. A password manager works, or generate each with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. Do not put secret values in the JSON config, Git, the ZIP, URLs, or client code. The config names which server secret variables to read; secrets are the intentional exception to keeping values in that file.

4. In the release ZIP, run:

   ```sh
   npm ci
   npm run build
   npm start
   ```

   The source repository retains the Sites build as `npm run build`; **in that checkout use `npm run build:node`** before `npm start`. The ZIP changes the default build to Node. `PORT` supplied by the host overrides the configured port. Do not start this release using `vinext start` directly: `npm start` installs the private access gate.

5. Open the URL. The browser first asks for username **`friend`** and the access password. Then create/log in to an Explorer character normally. Use **`admin`** and the separate admin password for the Dev tab. To switch the outer browser login, use a separate browser profile/private window. Character Log Out does not clear the browser's outer HTTP authentication.

The server refuses to start without both access passwords. Public origins must use HTTPS. For local use, set publicOrigin to `http://localhost:3000`, then open `http://localhost:3000/the-explorer/`. Keep API caching disabled at your CDN/proxy and allow streaming responses and requests lasting at least five minutes. Do not expose the Node inspector/debug port. Preserve the pinned dependency lockfile and install security updates before broadening access.

## GoDaddy

GoDaddy's Node.js Hosting supports ZIP uploads and applications launched with `npm start`; a PHP-only cPanel plan is a different runtime. See [GoDaddy's upload instructions](https://www.godaddy.com/en-ca/help/upload-my-ai-generated-app-to-godaddy-nodejs-hosting-42987) and [Node hosting announcement](https://www.godaddy.com/resources/news/godaddy-nodejs-hosting-launch).

Upload the supplied source ZIP (no `node_modules`). Set secrets and the HTTPS origin, install/build with development dependencies available, then start with `npm start`. The runtime needs no TypeScript executable, but the build needs the declared development tools. This package has been built and HTTP-tested locally; it has **not** been deployed into a GoDaddy account.

Before relying on the world, confirm with the selected plan that it supports Node 22.13+, a **persistent writable local directory surviving restarts and redeploys**, one app instance, and streamed requests lasting five minutes. The official launch documentation establishes a persistent Node process, but does not establish those disk and proxy guarantees. A persistent process is not proof of persistent disk. If those requirements are unavailable, use a Node VPS with persistent disk, or keep the existing Sites deployment.

## One folder for server data

Default layout:

```text
world-data/
  explorer.sqlite       # accounts, sessions, cells, regions, visits, queue, usage, server state
  explorer.sqlite-wal   # SQLite journal, when present
  explorer.sqlite-shm   # SQLite coordination, when present
  images/               # generated image objects, hashed file names
```

**World reset:** use Dev → World Administration → Wipe World, which preserves accounts and sessions. Never delete the data folder as a reset procedure; it contains account credentials. See [World administration](WORLD-ADMIN.md).

To back up, stop the process and copy the entire folder together, then restart. Restore that folder while stopped. Do not copy just the SQLite file while writes are running; its WAL may contain committed changes. Never delete or replace data underneath a running process. Keep backups outside the data folder if they should survive a reset.

Portable startup uses the current schema in `runtime/schema.sql`, not historical migrations that intentionally wiped earlier development worlds. Future schema changes must add an explicit nondestructive upgrade; do not replay the old reset scripts against the portable database. Existing Sites accounts/worlds stay in D1/R2 and are **not automatically migrated** into this fresh portable database. Deleting a local folder does not reset the existing Sites deployment.

## Keep the prototype private

Leave `hosting.noIndex` enabled. The app includes noindex metadata; the portable server adds `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` and `/robots.txt` disallows all crawling. Responses and images stay private. Do not publish a sitemap, advertise the domain, or post the link in public.

Those crawler instructions are requests, not access control. A link can leak, and hostile bots can ignore robots.txt. The **password gate** is what blocks unauthenticated visitors, including cell/profile share URLs, API endpoints, and assets. Send friends the URL and friend password separately. Never share the admin password. Changing the friend password and restarting revokes that shared access. Anyone with the friend password can create accounts and automate legitimate gameplay, so this remains a trusted-friends prototype, not an abuse-hardened public service.

Movement and transport still use server-owned character coordinates, valid cardinal exits, pending transport tokens, and transactional revisions. Supplying arbitrary coordinates does not authorize a move. This is not a claim that all possible vulnerabilities have been audited. The portable server strips incoming platform identity headers, and only its admin gate can create the trusted owner identity.

## Configuration and scenery tuning

`explorer.config.json` is the settings entry point:

| Section | Controls |
| --- | --- |
| hosting | Origin, listen port, data root, crawler policy, secret variable names, admin identity |
| provider | Text/image models, token ceilings, timeouts, existing image size/quality |
| queue / timing | Concurrent provider calls, leases, cooldowns, client deadlines |
| auth | Session lifetime and login throttles |
| world / intensity | Seed, format version, coordinate limit, gradual distance escalation |
| encounters | Frequency, repetition, whimsy, transport chance, broad interpretation categories |
| noise.wavelengths | Named field wavelengths in cells; smaller means more frequent spatial changes |
| noise.cellularSizes | Independent cellular gap/outcrop footprints |
| noise.centers | Cluster spacing, occupancy probability, footprint multiplier |
| noise.chanceMultipliers | Individual independent point-event frequency multipliers |
| noise.fieldAdjustments | Per-field gain and offset; absent features stay absent |

Recipe-specific gating, terrain relationships, enum mechanics, and mathematical constants remain application logic, rather than a second user settings system. New tuning parameters should be added to this file. Do not add secrets here: some safe settings are compiled into browser code. Secret values remain server-only. The Sites target may retain deployment environment overrides for its existing seed/models/admin identity.

Build and restart after changing generation/auth/timing settings. Startup detects a stale portable build and refuses inconsistent runtime settings. Origin, port, data path, and gate secrets are read at startup. Rebuild after changing noindex metadata too. Saved cell packages remain canonical; changed settings affect newly generated content. Changing the seed is not a world reset: stored visits and characters require a deliberate reset/migration too.

This revision shortens independently varying age/light/wind/human-influence fields, river branches, faults, ore/volcanic districts, roads, and several cluster spacings. It preserves the ocean/topology backbone and existing world seed. Settlement agricultural halos retain their relative widths. Small detail layers coexist with medium districts and broad regional identities. No new generation or procedural sampling tests were run, so the feel changes are based on recipe review rather than a fresh distribution audit.

## Developer verification and packaging

```sh
npm run typecheck
npm run test:runtime
npm run build:node
npm run smoke:node
npm run package:node
```

Runtime tests use temporary data and verify SQLite persistence, uniqueness, transaction rollback, image storage, the access gate, forged identity rejection, and unauthenticated movement rejection. The HTTP smoke test never requests an AI generation. The ZIP is source-only and excludes keys, `.env` files, accounts, world data, dependency folders, and build output.

The Sites target is still built with `npm run build` in the main checkout and deployed through Sites. `npm run start:sites` previews that Worker build locally. Its D1/R2 storage is managed remotely, so the single-folder reset applies to the **portable Node release**, not the remote Sites backend.

## Selected cPanel installation

App directory: `/home/eslsqgfz2ldc/nodeapps/the-explorer`. Data directory: `/home/eslsqgfz2ldc/data/the-explorer` (the configured relative path is `../../data/the-explorer`, resolved from the app directory). Node binary: `/home/eslsqgfz2ldc/.local/node-downloads/node-v22.23.2-linux-x64/bin/node`. Passenger startup file: `app.js`. Configure PassengerNodejs to that binary; setting the interactive shell PATH alone does not select Passenger�s runtime. The launcher disables automatic port selection until the access guard is attached, then explicitly binds to Passenger. Apache routing, permissions, and streaming still need verification on the hosting account.

