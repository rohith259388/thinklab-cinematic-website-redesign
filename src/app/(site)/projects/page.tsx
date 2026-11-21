import dynamic from 'next/dynamic';
import CmsPage from '@/components/cms/Page';
import { toProjectCard } from '@/lib/live';
import { siteContent } from '@/lib/cms/public';
import type { Metadata } from 'next';
import StageSetter from '@/components/experience/StageSetter';
import PageHero from '@/components/ui/PageHero';
import { entries } from '@/lib/cms/public';

const ProjectGallery = dynamic(() => import('@/components/home/ProjectGallery'), {
  loading: () => <div className="min-h-[500px] flex items-center justify-center font-mono text-xs text-[#9a97a8]">Loading projects…</div>,
});
const defaultMetadata: Metadata = { title: 'Projects', description: 'Explore Thinklab’s work across websites, Shopify stores, branding, SEO and digital marketing.', alternates: { canonical: '/projects' } };
export async function generateMetadata():Promise<Metadata>{const {page}=await siteContent();return {...defaultMetadata,...(page?.seoTitle?{title:page.seoTitle}:{}),...(page?.seoDescription?{description:page.seoDescription}:{}),...(page?.canonical?{alternates:{canonical:page.canonical}}:{})};}
export default async function ProjectsPage() { const projectCards=(await entries('projects')).map(toProjectCard);
  return <CmsPage>{<><StageSetter page="projects" /><div className="studio-content project-index-surface"><PageHero page="projects" kicker="18 collaborations. Countless possibilities." title="Projects" accent="with purpose." body="A closer look at the brands, businesses and digital experiences we help move forward." /><ProjectGallery projects={projectCards} mode="grid" /></div></>}</CmsPage>;
}
