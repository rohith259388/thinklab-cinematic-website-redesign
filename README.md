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

## Deployment

The site runs on Cloudflare Workers (`thinklab-website` on the info@thinklabdigitalsolutions.com account) through the OpenNext adapter. Every push to `main` deploys automatically via `.github/workflows/deploy.yml`, which needs a `CLOUDFLARE_API_TOKEN` repository secret with the "Edit Cloudflare Workers" template permissions. To deploy by hand, run `npx wrangler login` and then `npm run deploy`; `npm run preview` runs the production build locally in the Workers runtime. Production variables such as `DATABASE_URL`, `CMS_ORIGIN` and `CMS_SETUP_SECRET` are set with `npx wrangler secret put <NAME>`.

## Visual CMS (ThinkLab Studio)

ThinkLab Studio is available at `/admin`. It provides visual in-context editing of site copy, typography, sections, projects, and articles.

### Quick Setup & Admin Access

When sharing or cloning this repository, follow these 3 steps to access the admin panel:

1. **Configure Environment Variables**:
   ```bash
   cp .env.example .env.local
   ```
   Set `DATABASE_URL` to your PostgreSQL database (local Postgres, Docker, Supabase, Neon, etc.). Ensure `CMS_ORIGIN` matches the exact local development URL (default: `http://localhost:3000`).

2. **Seed the Static Admin User**:
   ```bash
   npm run seed:admin
   ```

   *(Optional: pass custom credentials with `npm run seed:admin -- --email user@example.com --password YourPasswordHere123`)*

3. **Start the Application & Log In**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000/admin](http://localhost:3000/admin) in your browser and enter your credentials.

See [CMS.md](CMS.md) for full architecture, publishing workflows, security guardrails, and schema specifications.
