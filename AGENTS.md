# The Explorer: agent entry point

Read `docs/EDIT-AND-PUBLISH.md` before editing or publishing.
Sites is the only active deployment target, confirmed by the owner on 2026-09-09.
Reuse the existing project in `.openai/hosting.json`.

- Edit source in `web/`. Build with `npm run build`, validate using focused non-generation checks, then publish through Sites when requested.
- GoDaddy, cPanel, portable Node packaging, and `outputs/github-deployment/` are deprecated historical artifacts. Do not build, synchronize, push or publish them, or ask the user to choose them as a target.
- Preserve the existing Sites audience unless the user requests an access change. Character login remains separate from Sites access.
- Never include secrets, databases, accounts or generated world data in source or release archives. Manage production secrets through Sites.
- Do not run paid AI generation or broad procedural sampling tests without explicit authorization.
- Never reset a world merely for testing or publishing. Owner override: an explicitly requested wipe deletes all accounts, credentials, sessions and world progress, and always changes the seed, unless the owner explicitly says otherwise. Never introduce account-deletion controls.
- Preserve unrelated source changes and historical deployment folders and Git metadata.
