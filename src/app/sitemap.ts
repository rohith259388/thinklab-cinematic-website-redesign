import type { MetadataRoute } from 'next';
import { projects, articles, careers, serviceDetails } from '@/lib/live';
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = 'https://www.thinklabdigitalsolutions.com';
  const routes = ['/', '/about', '/services', '/projects', '/reviews', '/blog', '/careers', '/contact', ...projects.filter(p => !p.archive).map(p => `/projects/${p.slug}`), ...articles.map(p => `/blog/${p.slug}`), ...careers.map(p => `/careers/${p.slug}`), ...serviceDetails.map(p => `/services/${p.slug}`)];
  return routes.map(path => ({ url: origin + path, changeFrequency: path === '/careers' ? 'weekly' : 'monthly', priority: path === '/' ? 1 : .7 }));
}
