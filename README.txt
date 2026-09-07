THE EXPLORER - GODADDY NODE PREVIEW

Upload this complete ZIP using Update Preview on the existing app.
Start command: npm start. The app is already compiled.

Set server environment variables (values are not included):
OPENAI_API_KEY
EXPLORER_ACCESS_PASSWORD (at least 24 characters)
EXPLORER_ADMIN_PASSWORD (different, at least 24 characters)

EXPLORER_PUBLIC_ORIGIN (https:// followed by the generated hostname, no path)
Set this after GoDaddy assigns the preview URL, then restart. Until set, startup
reports the missing setting and keeps the app closed. No rebuild or re-upload needed.
Open the configured origin followed by /the-explorer/.
If publishing assigns a new hostname, change EXPLORER_PUBLIC_ORIGIN and restart.

Data: ./world-data under the running application directory. Persistence across
redeploys is NOT verified. Confirm persistent storage before relying on saved progress.
This ZIP contains no credentials, accounts, world data, or node_modules.
The existing cPanel installation and live Sites world are not changed.
