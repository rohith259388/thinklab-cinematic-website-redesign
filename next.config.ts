import type { NextConfig } from "next";

import data from './src/lib/live-content.json';
const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  // Allow localtunnel and custom dev origins
  allowedDevOrigins: ['*.loca.lt', 'cold-ends-divide.loca.lt', '*.pinggy.link', '*.trycloudflare.com'],
  // worker-mailer imports `cloudflare:sockets`; keep it out of the Node bundle (only loaded on Workers).
  serverExternalPackages: ['worker-mailer'],
  // pg loads pg-cloudflare's real socket only under the workerd export condition, which file tracing skips.
  outputFileTracingIncludes: { '/*': ['./node_modules/pg-cloudflare/**/*'] },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
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

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
