import dynamic from 'next/dynamic';
import { Loader } from '@/components/ui/Loader';
import CmsPage from '@/components/cms/Page';
import { siteContent } from '@/lib/cms/public';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { team } from '@/lib/live';
import { ArrowUpRight } from 'lucide-react';
import { ABOUT, ABOUT_FAQS, CTA } from '@/lib/content';
import StageSetter from '@/components/experience/StageSetter';
import PageHero from '@/components/ui/PageHero';
import SectionIntro from '@/components/ui/SectionIntro';
import Marquee from '@/components/ui/Marquee';
import { Reveal, EnergyLine } from '@/components/ui/Reveal';
import { CmsText } from '@/components/cms/Canvas';

const Accordion = dynamic(() => import('@/components/ui/Accordion'), {
  loading: () => <Loader minHeight={200} />,
});

const defaultMetadata: Metadata = {
  title: 'About',
  description:
    'Who we are — the history, mission and vision of Thinklab Digital Solutions, the founders and the squad turning molten ideas into measurable digital growth.',
  alternates: { canonical: '/about' },
};
export async function generateMetadata():Promise<Metadata>{const {page}=await siteContent();return {...defaultMetadata,...(page?.seoTitle?{title:page.seoTitle}:{}),...(page?.seoDescription?{description:page.seoDescription}:{}),...(page?.canonical?{alternates:{canonical:page.canonical}}:{})};}

export default function AboutPage() {
  return <CmsPage>{(
    <>
      <StageSetter page="about" />
      <PageHero
        page="about"
        kicker={ABOUT.kicker}
        title="Curious minds."
        accent="Real ambition."
        body="We are strategists, designers and engineers with one shared belief: your next big idea deserves a team that cares as much as you do."
      />

      {/* ——— HISTORY / MISSION / VISION ——— */}
      <section className="mx-auto max-w-[1500px] px-5 py-16 md:px-10 md:py-24">
        <div className="grid gap-5 md:grid-cols-3">
          {ABOUT.pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.12}>
              <article className="glass sheen group relative h-full overflow-hidden p-8 md:p-10">
                <span className="text-outline font-display text-7xl md:text-8xl">{p.index}</span>
                <h2 className="mt-6 font-display text-[26px] tracking-tight text-[#fcfcf7]">
                  <CmsText field={`about.pillar.${i}.title`}>{p.title}</CmsText>
                </h2>
                <p className="mt-4 text-[14px] leading-relaxed text-[#9a97a8]">
                  <CmsText field={`about.pillar.${i}.body`}>{p.body}</CmsText>
                </p>
                <span className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(162,128,255,0.5)] to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ——— BRANDS ——— */}
      <section className="border-y border-[rgba(197,176,255,0.08)] bg-[rgba(13,13,13,0.55)] py-16 md:py-20">
        <p className="mb-10 text-center font-mono text-[10px] tracking-[0.4em] text-[#545454] uppercase">
          <CmsText field="about.brands.label">{ABOUT.brandsLabel}</CmsText>
        </p>
        <Marquee items={ABOUT.brands} />
      </section>

      {/* ——— FOUNDER ——— */}
      <section className="mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionIntro kicker={ABOUT.founder.kicker} title="Ajay Kumar" accent="Kattamuri" />
            <Reveal delay={0.2} className="mt-7 text-[15.5px] leading-relaxed text-[#9a97a8]">
              <CmsText field="about.founder.bio">{ABOUT.founder.body}</CmsText>
            </Reveal>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {ABOUT.founder.traits.map((t, i) => (
                <Reveal key={t} delay={0.25 + i * 0.06} y={14}>
                  <span className="chapter-chip rounded-full px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-[#c5b0ff] uppercase">
                    <CmsText field={`about.founder.trait.${i}`}>{t}</CmsText>
                  </span>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal delay={0.15}>
            <div className="team-photo"><Image src={team[0].image} alt="Ajay Kumar Kattamuri, founder of Thinklab" fill sizes="(max-width: 900px) 90vw, 40vw" loading="lazy" /></div>
          </Reveal>
        </div>
      </section>

      {/* ——— FEATURED IN ——— */}
      <section className="border-y border-[rgba(197,176,255,0.08)] bg-[rgba(13,13,13,0.55)] py-14 md:py-16">
        <p className="mb-8 text-center font-mono text-[10px] tracking-[0.4em] text-[#545454] uppercase">
          <CmsText field="about.cities.label">Working across cities</CmsText>
        </p>
        <Marquee items={ABOUT.featuredIn} glow />
      </section>

      {/* ——— PROCESS ——— */}
      <section className="mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-32">
        <SectionIntro kicker={ABOUT.process.kicker} title="Our 4 Stage" accent="Process" align="center" />
        <div className="relative mx-auto mt-16 max-w-3xl">
          <div className="absolute bottom-8 left-[19px] top-2 w-px bg-gradient-to-b from-[rgba(162,128,255,0.5)] via-[rgba(126,111,240,0.25)] to-transparent md:left-1/2" />
          {ABOUT.process.stages.map((s, i) => {
            const even = i % 2 === 0;
            return (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className={`relative mb-12 flex gap-6 md:w-1/2 md:gap-0 ${even ? 'md:flex-row-reverse md:pr-16 md:text-right' : 'md:ml-auto md:pl-16'}`}>
                  <span
                    className={`relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full border border-[rgba(162,128,255,0.4)] bg-[#0a0a0a] font-mono text-[10px] text-[#c5b0ff] shadow-[0_0_18px_rgba(126,111,240,0.35)] md:absolute md:top-0 ${
                      even ? 'md:right-0 md:translate-x-1/2' : 'md:left-0 md:-translate-x-1/2'
                    }`}
                  >
                    {s.index}
                  </span>
                  <div className="glass sheen flex-1 p-6 md:p-8">
                    <h3 className="font-display text-xl tracking-tight text-[#fcfcf7]">
                      <CmsText field={`about.process.${i}.title`}>{s.title}</CmsText>
                    </h3>
                    <p className="mt-3 text-[13.5px] leading-relaxed text-[#9a97a8]">
                      <CmsText field={`about.process.${i}.body`}>{s.body}</CmsText>
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ——— TEAM ——— */}
      <section className="border-t border-[rgba(197,176,255,0.08)] bg-[rgba(13,13,13,0.55)] py-24 md:py-32">
        <div className="mx-auto max-w-[1500px] px-5 md:px-10">
          <SectionIntro kicker={ABOUT.team.kicker} title="Say Hello to" accent="Our Squad" body={ABOUT.team.body} align="center" />
          <div className="team-portraits">{team.map(person => <Reveal key={person.name}><a href={person.linkedin} target="_blank" rel="noreferrer"><div className="team-photo"><Image src={person.image} alt={person.name} fill sizes="(max-width: 700px) 90vw, 30vw" loading="lazy" /></div><h3>{person.name}</h3><p>{person.role}<ArrowUpRight size={17} /></p></a></Reveal>)}</div>
        </div>
      </section>

      {/* ——— ABOUT FAQ ——— */}
      <section className="mx-auto max-w-[1100px] px-5 py-24 md:px-10 md:py-32">
        <SectionIntro kicker={ABOUT.faqKicker} title="Got Questions?" accent="We’ve Got Answers!" align="center" />
        <div className="mt-14">
          <Accordion items={ABOUT_FAQS} />
        </div>
        <Reveal delay={0.2} className="mt-16 text-center">
          <Link href="/contact" className="btn-drop sheen px-8 py-4 text-sm font-medium">
            {CTA.contact}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </section>

      <div className="mx-auto max-w-[1500px] px-5 pb-10 md:px-10">
        <EnergyLine />
      </div>
    </>
  )}</CmsPage>;
}
