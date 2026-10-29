import CmsPage from '@/components/cms/Page';
import { siteContent } from '@/lib/cms/public';
import type { Metadata } from 'next';
import StageSetter from '@/components/experience/StageSetter';
import PageHero from '@/components/ui/PageHero';
import ArticleLibrary from '@/components/content/ArticleLibrary';
import { entries } from '@/lib/cms/public';
const defaultMetadata: Metadata = { title: 'Insights', description: 'Ideas from Thinklab on marketing, websites, brand strategy, CRM, automation and business growth.', alternates: { canonical: '/blog' } };
export async function generateMetadata():Promise<Metadata>{const {page}=await siteContent();return {...defaultMetadata,...(page?.seoTitle?{title:page.seoTitle}:{}),...(page?.seoDescription?{description:page.seoDescription}:{}),...(page?.canonical?{alternates:{canonical:page.canonical}}:{})};}
export default async function BlogPage() { const articles=await entries('blog'); return <CmsPage>{<><StageSetter page="blog" /><PageHero page="blog" kicker="The Thinklab journal" title="A little insight." accent="A new perspective." body="50 ideas, guides and perspectives from the intersection of strategy, design and technology. Find the next move for your business." /><ArticleLibrary articles={articles.map(({ slug, title, image, category, date }) => ({ slug, title, image, category, date }))} /></>}</CmsPage>; }
