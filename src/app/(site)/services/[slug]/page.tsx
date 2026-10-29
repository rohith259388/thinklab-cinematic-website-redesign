import CmsPage from '@/components/cms/Page';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { serviceDetails } from '@/lib/live';
import DetailPage from '@/components/content/DetailPage';
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return serviceDetails.filter(e => !e.archive).map(e => ({ slug: e.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const entry = serviceDetails.find(e => e.slug === slug); return entry ? { title: entry.title, description: entry.summary.slice(0, 160), alternates: { canonical: `/services/${slug}` } } : { title: 'Page not found' }; }
export default async function Page({ params }: Props) { const { slug } = await params; const entry = serviceDetails.find(e => e.slug === slug); if (!entry) notFound(); if (entry.archive) redirect(entry.source); return <CmsPage>{<DetailPage entry={entry} page="services" back="/services" label="Services" />}</CmsPage>; }
