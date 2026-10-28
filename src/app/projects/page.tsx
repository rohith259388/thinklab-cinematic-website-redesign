import type { Metadata } from 'next';
import StageSetter from '@/components/experience/StageSetter';
import PageHero from '@/components/ui/PageHero';
import ProjectGallery from '@/components/home/ProjectGallery';
import { projectCards } from '@/lib/live';
export const metadata: Metadata = { title: 'Projects', description: 'Explore Thinklab’s work across websites, Shopify stores, branding, SEO and digital marketing.', alternates: { canonical: '/projects' } };
export default function ProjectsPage() {
  return <><StageSetter page="projects" /><div className="studio-content project-index-surface"><PageHero page="projects" kicker="18 collaborations. Countless possibilities." title="Projects" accent="with purpose." body="A closer look at the brands, businesses and digital experiences we help move forward." /><ProjectGallery projects={projectCards} /></div></>;
}
