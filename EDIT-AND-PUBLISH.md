# Edit and publish The Explorer

Current workflow, verified by the owner on 2026-09-07: local source → compiled
private GitHub repository → GoDaddy Update Preview → Publish to Live.
This supersedes older ZIP-upload and cPanel deployment instructions.

## Locations and responsibilities

| Location | Purpose |
| --- | --- |
| `web/` in the local workspace | Editable application source, tests and build tools |
| `web/outputs/github-deployment/` | Separate Git checkout containing the compiled Node release |
| `https://github.com/itsprocess/The-Explorer` (`main`, private) | GoDaddy's deployment source |
| GoDaddy Node.js Apps, The Explorer | Preview and published environments |

The deployment repo contains `app.js`, `runtime/`, `dist/`, the deployment-specific
`explorer.config.json`, and its own package files. It is not a complete editable
source repository. Make app changes in the local source and rebuild; do not patch
hashed compiled JavaScript as the normal editing workflow.

The existing Sites app is a separate deployment. Do not use Sites publication,
cPanel Passenger, ZIP upload, or the read-only hosted file manager for this workflow.

## Agent/developer release steps

1. Inspect source and deployment Git status. Preserve unrelated work. Make the
   requested source changes, including runtime changes under `web/runtime`.
2. From `web`, run the relevant checks below. Stop on any failing command:

   ```powershell
   npm run typecheck
   npm run build:node
   npm run smoke:node
   node --test tests/world-reset.test.mjs
   ```

   The smoke check starts a temporary server and database; it does not generate
   scenes or create real characters. The reset test operates on temporary test data.
   Run other focused tests when affected. Do not run paid generation or broad
   procedural sampling merely to validate a release. Runtime-only changes do not
   require rebuilding unchanged compiled application code; rerun the HTTP check.
3. Synchronize the validated release into the deployment checkout:

   ```powershell
   Copy-Item -Path dist/* -Destination outputs/github-deployment/dist -Recurse -Force
   Copy-Item -Path runtime/*.mjs -Destination outputs/github-deployment/runtime -Force
   ```

   Also copy changed `runtime/schema.sql`, `app.js`, and release docs when relevant.
   Use nondestructive schema upgrades; never replay historical reset migrations.
   Keep the deployment's own config and package/lock files. If changing shared
   non-hosting config, deliberately synchronize it and rebuild: the launcher checks
   the build/config hash. Dependency changes require updating and validating the
   deployment package and lockfile, not copying the source package wholesale.

   Copying build output currently overwrites active files and retains obsolete
   hashed chunks. Do not delete the entire deployment checkout to clean it.
4. Run `node scripts/check-secrets.mjs`. Review the deployment Git diff/status for
   unintended files. Never stage `.env*`, `.dev.vars*`, `node_modules`, `world-data`,
   SQLite files, credentials, or generated images. Then commit the intended files
   in `outputs/github-deployment` and push `origin main`. Stop if a check or push fails.
5. Report what changed and what passed. The owner then follows the dashboard steps
   below unless authenticated dashboard operation is available and authorized.
   A successful push alone is not a successful preview or live publication.

The deployment package intentionally has both `dev` and `start` set to
`node runtime/start.mjs`; GoDaddy preview can invoke `dev`, while live invokes
`start`. Its build command checks the already compiled launcher. The source repo's
`npm run build` targets Sites; use `npm run build:node` for this release.

## Owner: preview and publish

1. Open GoDaddy → Apps → The Explorer and click **Update Preview** after the agent
   pushes the release. Confirm the selected branch is `main` and the expected update
   is deployed. Wait for startup to finish.
2. Open preview from the dashboard while signed into GoDaddy. The landing page at
   `/` links to `/the-explorer/`. Sign in at the outer password prompt, then use the
   character login. Check the changed behavior on preview.
3. Click **Publish to Live**. Wait for success, then open the Published URL and verify
   the changed behavior there. Preview success alone does not verify live.

Leave Settings → General → **Root path** as `/`. This field also controls dashboard
health checks; there is no separate health-check-address field in the verified UI.
The app serves a public HTTP 200 landing page at `/` and a minimal `/healthz` endpoint.
Neither exposes game data. `/the-explorer/` and its APIs remain password-protected.
Do not change Root path to the protected game path or health checks may fail again.

## Environment settings

Configure secrets in GoDaddy, never in Git or browser code:

| Variable | Use |
| --- | --- |
| `OPENAI_API_KEY` | Server-side generation access |
| `EXPLORER_ACCESS_PASSWORD` | Outer login username `friend`; at least 24 characters |
| `EXPLORER_ADMIN_PASSWORD` | Outer login username `admin`; distinct, at least 24 characters |
| `EXPLORER_PUBLIC_ORIGIN` | That environment's generated HTTPS origin, without `/the-explorer/` |
| `WORLD_SEED` | Optional world seed; see reset procedure below |

Preview and live have different generated hostnames. Do not substitute the regular
root domain. For the initial publication, keep the working origin value so startup
can proceed; the public landing page can pass health checks before the final hostname
is known. Once publication reveals the live URL, set the live environment's origin
to that HTTPS hostname and restart before using the game there. Keep preview using
its preview origin. Verify the dashboard's environment scope when editing secrets;
do not assume preview values are automatically copied to live.

The origin must be present at startup. An incorrect preview origin on live can
cause state-changing requests to be rejected even when the landing page is healthy.
Origin validation and authentication must not be disabled to work around deployment.
The launcher binds once to the host-assigned `PORT` on `0.0.0.0`; do not restore the
old temporary localhost listener or bypass the launcher with `vinext start`.

## World administration without rebuilding

Sign in with the outer `admin` credentials → Dev → World Administration.
Set `WORLD_SEED` in the target environment and restart. The existing world keeps its
recorded seed until you explicitly use **Wipe World** and type `WIPE WORLD`.
A reset clears locations, images and character progress, returns characters alive
to origin, and preserves accounts, password hashes and login sessions. Active work
can block the reset; wait and retry. Do not reset merely to deploy an update.
See `WORLD-ADMIN.md` for details (in the source repo: `docs/WORLD-ADMIN.md`).

Runtime data lives under the deployment's `./world-data`. This reset preserves
accounts, but durability across hosting storage replacement has not been verified.
Do not promise that publishing backs up or migrates data. Preserve the data directory;
never delete it as a fix. Use a consistent full backup while the process is stopped
before any authorized storage migration.

## Troubleshooting from the latest log entries

- **Health check failed + app is listening + Auth required:** ensure the latest
  public-root fix is deployed and dashboard Root path is `/`.
- **Missing origin/password:** check secrets in the failing environment, then restart.
- **Missing dev script:** deployment package must retain the launcher alias above.
- **Port binding failure:** preserve assigned `PORT` and `0.0.0.0` single-listen startup.
- **Generation failure after startup:** inspect the request/Dev diagnostics and newest
  server logs; do not treat an old startup error as the current failure or wipe data.

Do not republish repeatedly without checking what failed. The logs can include older
failed attempts before later successful starts.
