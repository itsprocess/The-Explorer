# Sites: the only active deployment workflow

The owner confirmed Sites on 2026-09-09 and deprecated GoDaddy build and publication requests. This document supersedes all older Node, GoDaddy, cPanel, compiled-GitHub-deployment and ZIP-upload instructions. Do not ask which platform to use.

1. Edit application source in this web checkout. Reuse the project in .openai/hosting.json.
2. Run npm run typecheck and focused non-generation tests appropriate to the change. Build with npm run build. Do not run paid generation or broad procedural sampling without explicit authorization.
3. Follow the Sites hosting skill: commit the validated source, push to the Sites-provided source repository with a short-lived credential, package the build using the Sites package-site.sh helper, save the version and deploy it. Verify terminal deployment status.
4. Preserve the existing Sites audience, production secrets, D1 and R2 bindings. Character login is separate from Sites access. No outer password or configured domain-origin secret is needed.

Never include secrets, local environment files, databases, accounts or generated world data in source or deployment archives. No GoDaddy Update Preview or Publish to Live step remains. Legacy runtime scripts and outputs are historical only and must not be synchronized or published.

## Explicitly requested resets

Normal maintenance and publication preserve data and the seed. Current AGENTS.md rules are authoritative: a requested wipe resets the world and character progress and changes WORLD_SEED, preserving accounts, passwords, sessions and defining traits. Do not add account-deletion controls. Historical reset migrations record earlier authorized operations and are not instructions to repeat them.

Migration 0031 is the explicitly requested encounter/barrier rebalance world reset; it preserves identity and sessions. Production secrets (including DEV_PASSWORD) remain in Sites. Local setup forwards locally supplied values into ignored .dev.vars and uses explorer.config.json for provider/seed defaults.

## Current source map

The root README describes current behavior and validation. sandbox/README.md documents the standalone noise app. Runtime defaults in lib/fieldwork-baseline.json must match sandbox/reviewed-project.json. Maintain db/schema.ts and migration snapshots alongside schema changes; never create a duplicate migration for a column already applied.
