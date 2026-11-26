import dynamic from 'next/dynamic';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import CmsPage from '@/components/cms/Page';
import { toProjectCard } from '@/lib/live';
import { siteContent } from '@/lib/cms/public';
import type { Metadata } from 'next';
import StageSetter from '@/components/experience/StageSetter';
import PageHero from '@/components/ui/PageHero';
import { entries } from '@/lib/cms/public';

const ProjectBendGallery = dynamic(() => import('@/components/home/ProjectBendGallery'), {
  loading: () => <CardGridSkeleton count={3} minHeight={500} />,
});

const defaultMetadata: Metadata = {
  title: 'Projects',
  description: 'Explore Thinklab’s work across websites, Shopify stores, branding, SEO and digital marketing.',
  alternates: { canonical: '/projects' },
};

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await siteContent();
  return {
    ...defaultMetadata,
    ...(page?.seoTitle ? { title: page.seoTitle } : {}),
    ...(page?.seoDescription ? { description: page.seoDescription } : {}),
    ...(page?.canonical ? { alternates: { canonical: page.canonical } } : {}),
  };
}

export default async function ProjectsPage() {
  const projectCards = (await entries('projects')).map(toProjectCard);
  return (
    <CmsPage>
      <StageSetter page="projects" />
      <div className="studio-content project-index-surface">
        <PageHero
          page="projects"
          kicker="18 collaborations. Countless possibilities."
          title="Projects"
          accent="with purpose."
          body="A closer look at the brands, businesses and digital experiences we help move forward."
        />
        <ProjectBendGallery projects={projectCards} pageBg="#f0f0e9" cardBg="#ffffff" />
      </div>
    </CmsPage>
  );
}
