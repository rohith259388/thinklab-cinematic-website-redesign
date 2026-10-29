# Thinklab cinematic redesign

A responsive Next.js website for Thinklab Digital Solutions. Run `npm install` and `npm run dev` for local development; `npm run build` produces the production build.

## Content and pages

- Home, About, Services, Projects, Reviews, Insights, Careers and Contact.
- 18 project cards: 12 rebuilt case studies and six links to the original published archive, as requested.
- 50 searchable articles across six categories, seven detailed services and six career openings with their original application links.
- Founder and co-founder profiles, official contact information, opening hours and social links.
- Legacy address redirects, canonical URLs, sitemap and robots instructions.

Published Thinklab content and assets were imported on October 28, 2026 from https://www.thinklabdigitalsolutions.com. `src/lib/live-content.json` is the editable content snapshot. Each entry retains its source URL. Images are stored locally under `public/images/live`. To refresh the snapshot, run `python3 scripts/import-live-content.py` from the project root; this uses cached source HTML in `.design-reference` and preserves the six explicitly selected archive links. Review imported copy before publishing.

## Motion

The project gallery adds paired expanding reveals, gallery-only smooth wheel scrolling, viewport-anchored horizontal lens deformation, pointer tilt, rolling letter titles and text scrambling. Reduced-motion preferences disable the gallery effects. The gallery uses original CSS and GSAP, with Thinklab's own brand assets; Lusion is the visual interaction reference.

The original bulb/particle/lattice scene and its home scroll choreography are preserved. Verify the scene files with `shasum -a 256 -c .design-backup/animation.sha256`.

## Enquiries

The enquiry API requires a valid `DATABASE_URL` and the existing leads schema. Without a database, the site still builds, and the form returns a clear unavailable message directing visitors to the official email and phone number. It never reports a successful enquiry without saving it. Configure and test delivery before publishing. Career applications use Thinklab's existing external form.

## Checks

`npm run typecheck`, `npm run lint`, `npm run build`. The scroll field symmetry, direction independence, viewport normalization, settling and refresh-rate checks run with `node scripts/check-project-bend.mjs`.

The ESLint React immutability rule is disabled only for the original Three.js scene controller because it deliberately updates camera and scene objects every frame. Backup snapshots are excluded from linting.

## Visual CMS

Thinklab Studio is available at `/admin`. See [CMS.md](CMS.md) for the PostgreSQL bootstrap, publishing workflow, security architecture, verification commands and explicit remaining limitations. Production database configuration is required; no CMS credentials are embedded in the application.
