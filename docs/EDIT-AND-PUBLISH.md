# Sites: the only active deployment workflow

The owner confirmed Sites on 2026-09-09 and deprecated GoDaddy build and publication requests. This document supersedes all older Node, GoDaddy, cPanel, compiled-GitHub-deployment and ZIP-upload instructions. Do not ask which platform to use.

1. Edit application source in this web checkout. Reuse the project in .openai/hosting.json.
2. Run npm run typecheck and focused non-generation tests appropriate to the change. Build with npm run build. Do not run paid generation or broad procedural sampling without explicit authorization.
3. Follow the Sites hosting skill: commit the validated source, push to the Sites-provided source repository with a short-lived credential, package the build using the Sites package-site.sh helper, save the version and deploy it. Verify terminal deployment status.
4. Preserve the existing Sites audience, production secrets, D1 and R2 bindings. Character login is separate from Sites access. No outer password or configured domain-origin secret is needed.

Never include secrets, local environment files, databases, accounts or generated world data in source or deployment archives. No GoDaddy Update Preview or Publish to Live step remains. Legacy runtime scripts and outputs are historical only and must not be synchronized or published.

## Explicitly requested resets

A normal publication does not reset data. For a user-requested world wipe, use a one-time migration that preserves character identity, defining trait, password credentials and sessions while clearing generated world content and progress. The existing gated R2 cleanup must finish before new generation. Do not add an account-deletion control.

Migration 0023 implements the 2026-09-09 relic iteration wipe. Its new seed is the-stones-remember-your-footsteps; configure WORLD_SEED through Sites so an older override cannot retain the previous world. Older migrations that removed disposable dev accounts are historical authorizations, not current instructions.

Owner override, 2026-09-09: an explicitly requested wipe now clears ALL accounts, sessions and world data and always changes WORLD_SEED, unless the owner says otherwise. Do not reset during ordinary publishing or expose account-deletion controls. Migration 0025 is explicitly authorized for the sanctuary/affiliation iteration.
