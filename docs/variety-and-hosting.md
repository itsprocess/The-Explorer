# Variety update and hosting review

No reset or paid generation tests for this update. Existing saved scenes stay fixed. New cells use faster climate/elevation/roof transitions: elevation wavelength 300→72 cells, temperature 160→32, moisture 120→27, enclosure 90→20, forest 42→14. Ocean basins and the navigability backbone remain unchanged to preserve routes in the existing world. Newly generated terrain at old/new boundaries can differ from the old climate interpretation; saved neighbor prose remains continuity context.

Twelve independent scenery categories add pigment patches, resonance, interlacing, reversals, reuse, symbiosis, miniature habitats, visible transformations, play, precarious balance, displaced remnants and strange light. Each uses its own noise address and a recipe suited to patches, fronts, sparse points or small centers. Quiet cells remain possible. Strangeness has smaller stronger local patches and retains its distance escalation. Twenty-four new encounter categories broaden humor, curiosity, collaboration, celebration and unusual behavior. Base benign interaction selection rises from 25% to 32% in quiet areas, 30% to 40% around active features, and 38% to 48% around social features. Death/transport still take precedence and the origin stays safe. No claim about measured encounter frequency is made without a generation distribution test, which the user excluded this turn.

## Hosting

This is a Vinext/React application with a Cloudflare Worker server, D1 database, R2 images, secret bindings and Sites platform authentication. It is not a static bundle or PHP application for copying into cPanel public_html. GoDaddy now includes Node.js hosting in its Web Hosting plans, but that does not implement Cloudflare Worker bindings. A migration would need a Node-compatible server target, database/storage adapters and replacement authentication middleware. A generic VPS alone does not remove those dependencies.

Sources: [GoDaddy Node.js hosting](https://www.godaddy.com/resources/news/godaddy-nodejs-hosting-launch), [Cloudflare bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/).

## Security review and limits

- Movement receives a direction; the server calculates adjacent coordinates from the stored character, verifies open passages and life state, and saves through revision-checked atomic batches.
- Teleports use the server-stored pending destination and a matching token. Client-supplied coordinates are not used to select a landing.
- Image creation accepts only the authenticated character’s current coordinates. Share pages cannot move characters. Preloads remain disabled.
- Passwords are salted scrypt hashes; random session tokens are hashed in storage and sent in HttpOnly/SameSite cookies (Secure over HTTPS). Queries are parameterized and React escapes prose.
- OpenAI keys stay in runtime secrets, outside the public client build. Public records intentionally disclose visits and profiles; secrecy is not a general feature of those pages.
- Fixed an access gap: Dev and provider-resume previously accepted any platform sign-in. They now require the configured ADMIN_EMAIL, checked against the trusted Sites platform identity. Missing configuration fails closed. Dev is hidden from ordinary signed-in players.
- This identity check depends on Sites filtering/injecting authenticated headers. A standalone deployment MUST replace that trust boundary; directly exposing these headers on a generic server is unsafe.
- This is a bounded code review, not a penetration test or security certification. Public launch still needs gameplay/API-spend rate limits, multi-account/bot controls, production monitoring and a dependency/security review. Players can automate legitimate moves without warping; current queue capacity is not a spend budget.

Build/type checks and isolated admin authorization tests are permitted validation here; no scene/image calls or procedural distribution tests are run.
