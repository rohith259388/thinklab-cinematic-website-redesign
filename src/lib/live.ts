import data from './live-content.json';

export interface ContentBlock { type: string; text: string }
export interface LiveEntry {
  slug: string; title: string; source: string; image: string; date: string;
  summary: string; category: string; archive: boolean; blocks: ContentBlock[]; apply: string;
}
export const projects: LiveEntry[] = data.projects;
export const articles: LiveEntry[] = data.articles;
export const careers: LiveEntry[] = data.careers;
export const serviceDetails: LiveEntry[] = data.services;
export const team = data.team;
const projectTags: Record<string, string> = {
  hreemkarpapers: 'Corporate Website for Paper Manufacturing & Supply Company',
  'elevex-rentals': 'Website Redesign · Equipment-Focused Content · SEO · Conversion-Focused Design',
  'geeta-home-appliances': 'Shopify E-Commerce Website',
  'sandhatri-amaraone': 'Real Estate · Website · Marketing',
  'udyaan-projects': 'Real estate · Website development',
  'forge-arc-shopify-website-development': 'Shopify · E-commerce · Development',
  'avocado-brownies': 'Food & beverage · Digital marketing',
  'bliss-valley': 'Real estate · Digital marketing',
  'bhaskara-homes-by-pvr-group': 'Real estate · Digital marketing',
  'reform-studios': 'Architecture · Digital marketing',
  impactgrad: 'Website development · Digital strategy',
  clarins: 'Brand strategy · Customer engagement',
};
export const projectCards = projects.map(p => ({
  slug: p.slug, title: p.title.replace(/ [—–] .*/, '').replace(/\s*\(.*\)/, ''), image: p.image,
  href: p.archive ? p.source : `/projects/${p.slug}`,
  tags: p.archive ? 'From the archive · Original case study ↗' : projectTags[p.slug] || 'Design · Development · Strategy',
  archive: p.archive,
  summary: p.summary,
  category: p.category,
}));

export function toProjectCard(p: LiveEntry & { tags?: string }) {
  return {
    slug: p.slug,
    title: p.title.replace(/ [—–] .*/, '').replace(/\s*\(.*\)/, ''),
    image: p.image,
    href: p.archive ? p.source : `/projects/${p.slug}`,
    tags: p.tags || (p.archive ? 'From the archive · Original case study ↗' : projectTags[p.slug] || 'Design · Development · Strategy'),
    archive: p.archive,
    summary: p.summary,
    category: p.category,
  };
}
