import CmsPage from '@/components/cms/Page';
import { siteContent } from '@/lib/cms/public';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, CheckCircle2, Code2, Compass, Database, Fingerprint, Megaphone, Workflow, CalendarDays,
} from 'lucide-react';
import { SERVICES, WHY_CHOOSE, CTA } from '@/lib/content';
import StageSetter from '@/components/experience/StageSetter';
import PageHero from '@/components/ui/PageHero';
import SectionIntro from '@/components/ui/SectionIntro';
import Magnetic from '@/components/ui/Magnetic';
import { Reveal, EnergyLine } from '@/components/ui/Reveal';

const defaultMetadata: Metadata = {
  title: 'Services',
  description:
    'Digital marketing, website development, brand strategy, workflow & AI automation, CRM services and strategic planning — every Thinklab service powers a different chamber of one growth engine.',
  alternates: { canonical: '/services' },
};
export async function generateMetadata():Promise<Metadata>{const {page}=await siteContent();return {...defaultMetadata,...(page?.seoTitle?{title:page.seoTitle}:{}),...(page?.seoDescription?{description:page.seoDescription}:{}),...(page?.canonical?{alternates:{canonical:page.canonical}}:{})};}

const SERVICE_ICONS = [Megaphone, Code2, Fingerprint, Workflow, Database, Compass, CalendarDays];

export default function ServicesPage() {
  return <CmsPage>{(
    <>
      <StageSetter page="services" />
      <PageHero
        page="services"
        kicker="Services"
        title="Built around"
        accent="your ambition."
        body="Strategy, design, marketing and technology. Seven connected disciplines that help your business move forward."
      >
        <Reveal delay={0.45} className="mt-10 flex flex-wrap gap-3">
          {SERVICES.map((s) => (
            <Link
              key={s.id}
              href={`#${s.id}`}
              className="chapter-chip rounded-full px-4 py-2 font-mono text-[9.5px] tracking-[0.24em] text-[#c9c7d4] uppercase transition-all duration-500 hover:border-[rgba(162,128,255,0.5)] hover:text-[#fcfcf7]"
            >
              {s.index} · {s.title}
            </Link>
          ))}
        </Reveal>
      </PageHero>

      {/* ——— THE CHAMBERS ——— */}
      <section aria-label="Service chambers">
        {SERVICES.map((s, i) => {
          const Icon = SERVICE_ICONS[i];
          const flip = i % 2 === 1;
          return (
            <div key={s.id} id={s.id} className="scroll-mt-28 border-t border-[rgba(197,176,255,0.08)]">
              <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-16 md:grid-cols-[1fr_1.25fr] md:gap-16 md:px-10 md:py-24">
                <Reveal className={flip ? 'md:order-2' : ''}>
                  <div className="relative">
                    <span className="text-outline block font-display text-[clamp(4.5rem,10vw,9rem)] leading-none">{s.index}</span>
                    <div className="mt-6 flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(162,128,255,0.3)] bg-[rgba(24,10,64,0.4)]">
                        <Icon className="h-5 w-5 text-[#a280ff]" />
                      </span>
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.3em] text-[#7e6ff0] uppercase">Chamber {s.index}</p>
                        <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-[#545454] uppercase">{s.layer}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
                <Reveal delay={0.12} className={flip ? 'md:order-1' : ''}>
                  <h2 className="font-display text-[clamp(1.9rem,3.4vw,3rem)] tracking-tight text-[#fcfcf7]">{s.title}</h2>
                  <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#9a97a8]">{s.description}</p>
                  <ul className="mt-7 grid max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {s.capabilities.map((c) => (
                      <li key={c} className="flex items-center gap-2.5 text-[13.5px] text-[#c9c7d4]">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#7e6ff0]" />
                        {c}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/services/${s.id}`}
                    className="group mt-8 inline-flex items-center gap-2.5 font-mono text-[10.5px] tracking-[0.26em] text-[#a280ff] uppercase"
                  >
                    Explore this service
                    <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1.5" />
                    <span className="energy-line absolute -bottom-1 left-0 hidden w-full" />
                  </Link>
                </Reveal>
              </div>
            </div>
          );
        })}
      </section>

      {/* ——— WHY CHOOSE US ——— */}
      <section className="border-t border-[rgba(197,176,255,0.08)] bg-[rgba(13,13,13,0.55)] py-24 md:py-32">
        <div className="mx-auto max-w-[1500px] px-5 md:px-10">
          <SectionIntro kicker="Why Choose Us" title="Why we are your" accent="best choice" align="center" />
          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {WHY_CHOOSE.map((w, i) => (
              <Reveal key={w.title} delay={(i % 3) * 0.09}>
                <article className="glass sheen group h-full p-7 transition-transform duration-700 hover:-translate-y-1.5 md:p-8">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl italic text-[rgba(162,128,255,0.55)]">0{i + 1}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#a280ff] shadow-[0_0_12px_rgba(162,128,255,0.9)] transition-all duration-700 group-hover:scale-150" />
                  </div>
                  <h3 className="mt-6 font-display text-[21px] tracking-tight text-[#fcfcf7]">{w.title}</h3>
                  <p className="mt-3.5 text-[13.5px] leading-relaxed text-[#9a97a8]">{w.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2} className="mt-16 text-center">
            <Magnetic>
              <Link href="/contact" className="btn-drop sheen px-8 py-4 text-sm font-medium">
                {CTA.contact}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10">
        <EnergyLine />
      </div>
    </>
  )}</CmsPage>;
}
