import type { MetadataRoute } from 'next';
import { projects,articles,careers,serviceDetails } from '@/lib/live';
import { publicDocuments } from '@/lib/cms/public';
import { documentPath } from '@/lib/cms/schema';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const origin='https://www.thinklabdigitalsolutions.com';
 let routes=['/','/about','/services','/projects','/reviews','/blog','/careers','/contact',...projects.filter(p=>!p.archive).map(p=>`/projects/${p.slug}`),...articles.map(p=>`/blog/${p.slug}`),...careers.map(p=>`/careers/${p.slug}`)];
 if(process.env.DATABASE_URL){const lists=await Promise.all(['page','projects','blog','careers'].map(k=>publicDocuments(k as 'page'|'projects'|'blog'|'careers')));routes=lists.flatMap(list=>(list||[]).filter(d=>!d.published?.archive).map(documentPath));}
 return [...routes,...serviceDetails.map(p=>`/services/${p.slug}`)].map(path=>({url:origin+path,changeFrequency:'monthly',priority:path==='/'?1:.7}));
}
