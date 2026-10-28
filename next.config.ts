import type { NextConfig } from "next";

import data from './src/lib/live-content.json';
const nextConfig: NextConfig = {
  async redirects() {
    const fixed = [['/about-us', '/about'], ['/contact-us', '/contact'], ['/case-studies', '/projects'], ['/blogs', '/blog']];
    const entries = [
      ...data.projects.filter(p => !p.archive).map(p => [new URL(p.source).pathname, `/projects/${p.slug}`]),
      ...data.articles.map(p => [new URL(p.source).pathname, `/blog/${p.slug}`]),
      ...data.services.map(p => [new URL(p.source).pathname, `/services/${p.slug}`]),
    ];
    return [...fixed, ...entries].map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

export default nextConfig;
