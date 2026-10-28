import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { projects } from '@/lib/live';
import DetailPage from '@/components/content/DetailPage';
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return projects.filter(e => !e.archive).map(e => ({ slug: e.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const entry = projects.find(e => e.slug === slug); return entry ? { title: entry.title, description: entry.summary.slice(0, 160), alternates: { canonical: `/projects/${slug}` } } : { title: 'Page not found' }; }
export default async function Page({ params }: Props) { const { slug } = await params; const entry = projects.find(e => e.slug === slug); if (!entry) notFound(); if (entry.archive) redirect(entry.source); return <DetailPage entry={entry} page="projects" back="/projects" label="Projects" />; }
