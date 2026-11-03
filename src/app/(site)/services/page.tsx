import CmsPage from '@/components/cms/Page';
import { siteContent } from '@/lib/cms/public';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { WHY_CHOOSE, CTA } from '@/lib/content';
import StageSetter from '@/components/experience/StageSetter';
import PageHero from '@/components/ui/PageHero';
import ServiceExplorer from '@/components/ui/ServiceExplorer';
import SectionIntro from '@/components/ui/SectionIntro';
import Magnetic from '@/components/ui/Magnetic';
import { Reveal, EnergyLine } from '@/components/ui/Reveal';
import { CmsText } from '@/components/cms/Canvas';

const defaultMetadata: Metadata = {
  title: 'Services',
  description:
    'Digital marketing, website development, brand strategy, workflow & AI automation, CRM services and strategic planning — every Thinklab service powers a different chamber of one growth engine.',
  alternates: { canonical: '/services' },
};
export async function generateMetadata():Promise<Metadata>{const {page}=await siteContent();return {...defaultMetadata,...(page?.seoTitle?{title:page.seoTitle}:{}),...(page?.seoDescription?{description:page.seoDescription}:{}),...(page?.canonical?{alternates:{canonical:page.canonical}}:{})};}

export default function ServicesPage() {
  return <CmsPage>{(
    <>
      <StageSetter page="services" />
      <div className="ink-surface">
        <PageHero
          page="services"
          kicker="Services"
          title="Built around"
          accent="your ambition."
          body="Seven connected disciplines. Pick one to see how it works."
        />

        <Reveal>
          <ServiceExplorer />
        </Reveal>

        {/* ——— WHY CHOOSE US ——— */}
        <section className="border-t border-[rgba(197,176,255,0.08)] py-24 md:py-28">
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
                    <h3 className="mt-6 font-display text-[21px] tracking-tight text-[#fcfcf7]">
                      <CmsText field={`services.why.${i}.title`}>{w.title}</CmsText>
                    </h3>
                    <p className="mt-3.5 text-[13.5px] leading-relaxed text-[#bdb9c9]">
                      <CmsText field={`services.why.${i}.desc`}>{w.description}</CmsText>
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.2} className="mt-16 text-center">
              <Magnetic>
                <Link href="/contact" className="btn-drop sheen px-8 py-4 text-sm font-medium">
                  <CmsText field="services.cta">{CTA.contact}</CmsText>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Magnetic>
            </Reveal>
          </div>
        </section>

        <div className="mx-auto max-w-[1500px] px-5 pb-10 md:px-10">
          <EnergyLine />
        </div>
      </div>
    </>
  )}</CmsPage>;
}
