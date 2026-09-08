# Deployment repository guidance

Read EDIT-AND-PUBLISH.md before making changes.
This is the compiled release repository. Edit the original web source checkout and rebuild there.
Do not treat hashed dist files as editable source, replace deployment config/package files wholesale,
commit secrets or runtime data, or wipe the world while testing/publishing.
Preserve both dev and start launcher scripts and the public / health-check landing page.
The game remains at /the-explorer/ behind authentication. Keep accounts and sessions intact.
A push is followed by GoDaddy Update Preview and Publish to Live; verify both separately.
