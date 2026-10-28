import type { Metadata } from 'next';
import StageSetter from '@/components/experience/StageSetter';
import PageHero from '@/components/ui/PageHero';
import ArticleLibrary from '@/components/content/ArticleLibrary';
import { articles } from '@/lib/live';
export const metadata: Metadata = { title: 'Insights', description: 'Ideas from Thinklab on marketing, websites, brand strategy, CRM, automation and business growth.', alternates: { canonical: '/blog' } };
export default function BlogPage() { return <><StageSetter page="blog" /><PageHero page="blog" kicker="The Thinklab journal" title="A little insight." accent="A new perspective." body="50 ideas, guides and perspectives from the intersection of strategy, design and technology. Find the next move for your business." /><ArticleLibrary articles={articles.map(({ slug, title, image, category, date }) => ({ slug, title, image, category, date }))} /></>; }
