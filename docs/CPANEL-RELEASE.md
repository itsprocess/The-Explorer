> DEPRECATED (2026-09-09): Historical portable hosting documentation only. Do not execute these build, upload or publication instructions. Sites is the sole active target; see [Edit and publish](EDIT-AND-PUBLISH.md).

# Precompiled cPanel release

Build locally with `npm run build:node`, then `npm run package:cpanel`.
Upload `outputs/the-explorer-cpanel.zip` and extract in the private app directory,
then run `npm ci --omit=dev`. Do not run a build on the shared host.

The archive includes app.js, runtime, dist, configuration, and matching package/lock
files. It contains no node_modules, credentials, or data directory. It preserves
the configured world seed and does not reset the separate data directory. Back up
any customized configuration before replacing an older release.

The packager verifies a clean production-only install, a Linux x64 install dry run,
the production dependency audit, and HTTP behavior without requesting generation.
The September 7 release uses React/RSC 19.2.8 and Vinext beta.9;
`npm audit --omit=dev` reports zero known vulnerabilities. Development tools still
have audit findings and are excluded from the server install. This audit does not
guarantee complete application security.

Passenger's Apache documentation lists PassengerNodejs for server, virtual-host,
and directory configuration, not .htaccess. Do not assume this setting is permitted
in .htaccess on this account. Confirm the hosting-supported way to select the
private Node executable before deployment:
https://www.phusionpassenger.com/docs/references/config_reference/apache/#passengernodejs

Selected Node executable:
`/home/eslsqgfz2ldc/.local/node-downloads/node-v22.23.2-linux-x64/bin/node`

App directory: `/home/eslsqgfz2ldc/nodeapps/the-explorer`

Separate data directory: `/home/eslsqgfz2ldc/data/the-explorer`

Public mount: `https://appliedcoordination.com/the-explorer/`

Real Passenger startup, Apache routing, and streaming still require verification
on the account. No existing live Sites deployment was changed by this packaging.
