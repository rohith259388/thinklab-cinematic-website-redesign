import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import StageSetter from '@/components/experience/StageSetter';
import PageHero from '@/components/ui/PageHero';
import { careers } from '@/lib/live';
import { Reveal } from '@/components/ui/Reveal';
export const metadata: Metadata = { title: 'Careers', description: 'Join Thinklab. Explore roles in design, development, video, social media and project consulting.', alternates: { canonical: '/careers' } };
export default function CareersPage() { return <><StageSetter page="about" /><PageHero page="about" kicker="Make your next move" title="Good minds." accent="Great together." body="Designers, builders, storytellers and problem solvers. Bring your curiosity to a team that turns ideas into work that matters." /><section className="editorial-wrap"><div className="job-list">{careers.map((job, i) => <Reveal key={job.slug}><Link className="job-row" href={`/careers/${job.slug}`}><span className="micro-label">0{i + 1}</span><div><h2>{job.title}</h2><p>{job.blocks.find(b => b.text.startsWith('Location:'))?.text.replace('Location: ', '')} · {job.date}</p></div><ArrowUpRight /></Link></Reveal>)}</div></section></>; }
