# Sites testing is the current workflow

The owner explicitly requested Sites publication and deletion of all current dev accounts and world content. Use the existing project in .openai/hosting.json, build with npm run build, and publish via Sites. Do not use GoDaddy Node packaging, domain-origin secrets, or an outer site password. Character login remains part of the game; Sites retains its existing owner-only access.

The one-time 0015 migration clears dev accounts, sessions, world records and history. It schedules a gated R2 bucket cleanup before new generation. The migration ledger prevents later publications from repeating the wipe. No account-deletion UI or public reset endpoint is added.

Keep API keys as Sites secrets. Ordinary request-origin validation remains enabled and uses the actual request origin, without any configured domain secret. Legacy Node files are retained only as historical source, not the active test workflow.
