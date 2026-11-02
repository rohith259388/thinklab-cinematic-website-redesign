# Thinklab Studio

## What is implemented

The `/admin` route is a real authenticated CMS, separate from the public site's animated layout. It renders the actual site in a same-origin iframe, with 1280px, 768px and 390px viewport presets and fit-to-workspace scaling. Registered text and links can be selected in the canvas or layer list; draft edits are sent to React components immediately. Collection details use the original detail component. No database-supplied JavaScript or HTML is executed.

Pages, Projects, Journal and Careers have database-backed drafts, publishing, unpublishing and version history. Custom pages support registered statement, text, image and CTA sections, section ordering, colors, spacing and alignment. Registered text supports the existing three website fonts, size, foreground/background color and padding. The original bulb, particles and motion controller are preserved.

Header CTA, synchronized header/footer navigation labels and destinations, footer contact details and CTA, and registered shared sections are editable global content. Built-in page hero/section-heading components and selected home sections are registered; the editor deliberately exposes those supported elements rather than pretending every existing DOM element is editable.

Media uploads accept PNG/JPEG/WebP, enforce byte and decoded-pixel limits, verify signatures, decode and re-encode with Sharp, strip metadata, and store image bytes in PostgreSQL. SVG, executable files and arbitrary remote image URLs are rejected. Draft-only assets require authentication. Published assets become publicly readable. Deletion is blocked while a draft, published document or retained historical version references an asset.

## Production setup

1. Create `.env.local` from `.env.example` locally, or configure equivalent deployment secrets. Use your PostgreSQL `DATABASE_URL`, the exact HTTPS origin as `CMS_ORIGIN`, and a cryptographically random `CMS_SETUP_SECRET` of at least 32 characters. Never commit credentials.
2. Use a dedicated PostgreSQL database/schema with a database user authorized to create the `cms_*` tables. The first request initializes the CMS in a transaction protected by an advisory lock. It imports the real existing content once; subsequent starts do not overwrite edits. The existing `leads` table is untouched.
3. Run `npm run build`, then deploy/start the Node.js application with these environment variables. Production session cookies require HTTPS (localhost testing is supported by browsers).
4. Open `/admin`, select **First-time setup**, and create the first administrator using the setup secret. Setup refuses to create a second initial administrator. Remove the setup secret from the deployment after bootstrap.
5. Create editor/publisher accounts from **Team access**. Editors can save drafts and upload media; publishers can additionally publish/unpublish/delete; only admins can create users.
6. Back up the database, including `cms_media`, `cms_documents`, `cms_versions` and user records. The hosting filesystem is not used for persisted CMS content. Configure the hosting request-size limit to at least 6 MB if image uploads are required; some serverless providers have lower limits.

A production `DATABASE_URL` was not present in the workspace during implementation, even after the setup reply. Production configuration and deployment have **not** been verified or performed. The working local verification environment uses an isolated PostgreSQL 16 container, not the production database.

## Editing and publishing

Select a page or entry, edit registered properties/content, and choose **Save draft** (Cmd/Ctrl+S). Public requests read only the published snapshot. **Publish** saves the current draft and then publishes it. Editor state has undo/redo (Cmd/Ctrl+Z / Shift+Cmd/Ctrl+Z outside text inputs), unsaved-change warnings and server revision checks to prevent overwriting another editor's changes. Restoring a version changes only the draft until explicitly published.

Preview URLs require an active CMS session. They are not bearer links and cannot be used by anonymous reviewers. The server authenticates previews regardless of supplied headers; the proxy strips incoming CMS headers and derives context from the request URL. Preview responses are private/no-store and noindex. Both browser messages and mutations check same-origin boundaries. Cookies are HTTP-only, SameSite=Strict, secure in production, expire after eight hours and are revoked on logout. Passwords use salted scrypt; session tokens are random and stored hashed. Failed logins are rate-limited in PostgreSQL.

Public rendering is dynamic and queries only published JSON; React request caching deduplicates page context within a request, while preventing cross-user draft caching. Publishing invalidates route/layout/sitemap caches. Sitemap entries come from published pages and collections. Metadata supports title, description and canonical URL. The original local content remains the fallback only when no database is configured; a configured database outage does not silently replace published content with defaults.

## Current limits / remaining work

This is a bounded visual CMS, not full Framer parity:

- Existing page sections are preserved in their authored layout. Added sections can be reordered; arbitrary restructuring/dragging of every original section is not implemented. Many legacy body-copy fields, original team portraits and service-detail records are not yet registered for visual editing.
- Text is edited in the contextual inspector, not with an inline contenteditable caret. Rich text supports paragraphs, headings, list items and automatically linked URLs; inline bold/italic/link authoring, tables and nested blocks are not yet implemented.
- Slugs are chosen at creation and remain fixed to protect existing routes. Rename-with-redirect management is not implemented.
- Shared header/navigation/footer fields and sections that appear across all pages are implemented. A library of named reusable section instances synchronized across multiple pages is not implemented.
- Preview links require login; expiring share-token previews, collaborative presence, scheduled publishing, MFA/SSO, password reset and user revocation/role-editing UI are not implemented. Administrators can manage users/sessions directly in PostgreSQL until those flows are added.
- Media browser shows uploaded assets, not the entire imported filesystem asset catalog. Uploaded asset names are retained; rename/folders/search and pagination are not implemented. Database image storage is suitable for the current bounded library; a larger library should use private object storage plus signed access.
- Lists are currently fetched as bounded site-size collections without pagination. Draft saving is explicit; status is shown, but background autosave is not implemented.

## Checks

- `node scripts/check-cms.mjs`: validates every imported collection record, URL restrictions, rich-text registry, style restrictions and slugs.
- `node scripts/check-project-bend.mjs`: verifies the existing project scroll effects and scroll-release regression.
- `npm run lint`, `npm run typecheck`, `npm run build`.
- `shasum -a 256 -c .design-backup/animation.sha256` verifies the original Three.js scene and motion files.
- `scripts/check-cms-integration.mjs` is destructive only to named test records and refuses database URLs that do not identify the `cms_test` database. Run against a disposable PostgreSQL database and a separate application server, using `node --env-file=.cms-test.env scripts/check-cms-integration.mjs`. It checks actual home HTML, draft/private preview separation, publishing, optimistic conflicts, restoration, all collection listings/details, new pages, unpublishing, sitemap updates, media privacy, CSRF and role checks. It verifies persistence directly through PostgreSQL and was rerun after restarting the application process.

Page content providers render within leaf routes, preventing stale page content during client navigation while keeping the animation shell persistent.

The local verification files `.cms-test.env` and `.cms-browser-test.json` contain randomly generated test-only credentials and are gitignored. Never deploy them. The test database is the Docker container `thinklab-cms-check`, bound to loopback port 55439; the test application runs at `http://localhost:3002/admin`. Keep this distinct from the production setup above.

## Verification — 30 October 2026

Rebuilt the current committed redesign and restarted the local PostgreSQL-backed preview at `http://localhost:3002/admin`. Lint, TypeScript, production build, schema checks, project-scroll regression checks, and the complete PostgreSQL publishing integration suite passed. Test fixtures were cleaned up by the suite.

The original bulb and all nine experience component checksums still match. The older checksum for `src/lib/motion.ts` differs because commit `b818557` deliberately adjusted inner-page brightness; those existing changes were preserved. The checksum command therefore reports one mismatch and must not be described as wholly passing.

This verifies the local test environment only. Production connection and deployment remain outstanding, together with the feature limitations listed above.
