import CmsPage from '@/components/cms/Page';
import { siteContent } from '@/lib/cms/public';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MapPin, Phone, Star } from 'lucide-react';
import { BRAND, CONTACT_META } from '@/lib/content';
import StageSetter from '@/components/experience/StageSetter';
import PageHero from '@/components/ui/PageHero';
import LeadForm from '@/components/ui/LeadForm';
import Magnetic from '@/components/ui/Magnetic';
import { Reveal, EnergyLine } from '@/components/ui/Reveal';
import { CmsText } from '@/components/cms/Canvas';

const defaultMetadata: Metadata = {
  title: 'Contact',
  description:
    'Start the next spark. Speak with Thinklab Digital Solutions — Vijayawada, AP, India and Mascot, Sydney, Australia. +61 493 305 496 · +91 93475 80911.',
  alternates: { canonical: '/contact' },
};
export async function generateMetadata():Promise<Metadata>{const {page}=await siteContent();return {...defaultMetadata,...(page?.seoTitle?{title:page.seoTitle}:{}),...(page?.seoDescription?{description:page.seoDescription}:{}),...(page?.canonical?{alternates:{canonical:page.canonical}}:{})};}

export default function ContactPage() {
  return <CmsPage>{(
    <>
      <StageSetter page="contact" />
      <div className="ink-surface">
      <PageHero
        page="contact"
        kicker={CONTACT_META.kicker}
        title="It starts with"
        accent="a conversation."
        body={CONTACT_META.body}
      />

      <section className="mx-auto max-w-[1500px] px-5 pb-16 md:px-10 md:pb-24">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Reveal>
            <Suspense fallback={<div className="glass p-9 font-mono text-[11px] tracking-[0.3em] text-[#9a97a8] uppercase">Loading enquiry form…</div>}>
              <LeadForm source="contact" />
            </Suspense>
          </Reveal>

          <div className="flex flex-col gap-6">
            <Reveal delay={0.1}>
              <div className="glass sheen p-7 md:p-8">
                <p className="font-mono text-[10px] tracking-[0.3em] text-[#7e6ff0] uppercase">
                  <CmsText field="contact.direct.label">Direct lines</CmsText>
                </p>
                <a className="mt-5 block break-all text-sm text-[#c5b0ff]" href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
                <ul className="mt-5 space-y-4">
                  {BRAND.phones.map((p, i) => (
                    <li key={p.href}>
                      <a href={p.href} className="group flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(162,128,255,0.3)] bg-[rgba(24,10,64,0.35)] transition-all duration-500 group-hover:border-[rgba(162,128,255,0.7)]">
                          <Phone className="h-4 w-4 text-[#c5b0ff]" />
                        </span>
                        <span>
                          <span className="block text-[15px] text-[#fcfcf7] transition-colors group-hover:text-[#c5b0ff]">
                            <CmsText field={`contact.phone.${i}.label`}>{p.label}</CmsText>
                          </span>
                          <span className="block font-mono text-[9.5px] tracking-[0.24em] text-[#545454] uppercase">{p.region}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="glass sheen p-7 md:p-8">
                <p className="font-mono text-[10px] tracking-[0.3em] text-[#7e6ff0] uppercase">
                  <CmsText field="contact.coordinates.label">Coordinates</CmsText>
                </p>
                <p className="mt-5 text-sm leading-7 text-[#aaa6b2]">
                  <CmsText field="contact.hours">Monday–Friday · 9am–6pm<br />Saturday · 9am–1pm<br />Sunday · Closed</CmsText>
                </p>
                <ul className="mt-5 space-y-4">
                  {BRAND.locations.map((l, i) => (
                    <li key={l} className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(228,195,144,0.3)] bg-[rgba(228,195,144,0.06)]">
                        <MapPin className="h-4 w-4 text-[#e4c390]" />
                      </span>
                      <span className="text-[15px] text-[#e9e3dc]">
                        <CmsText field={`contact.location.${i}`}>{l}</CmsText>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.26}>
              <div className="glass sheen flex items-center gap-4 p-7 md:p-8">
                <span className="flex -space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#e4c390] text-[#e4c390]" />
                  ))}
                </span>
                <span className="font-mono text-[10px] tracking-[0.24em] text-[#9a97a8] uppercase">
                  <CmsText field="contact.reviews.label">200+ 5 Star Reviews</CmsText>
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ——— THE FINAL HEADLINE — the cycle begins again ——— */}
      <section className="relative overflow-hidden px-5 pb-28 pt-10 text-center md:pb-40">
        <EnergyLine className="absolute left-1/2 top-0 w-[min(720px,80vw)] -translate-x-1/2" />
        <Reveal>
          <p className="font-mono text-[10.5px] tracking-[0.44em] text-[#e4c390] uppercase">
            <CmsText field="contact.final.kicker">YOUR NEXT CHAPTER STARTS HERE</CmsText>
          </p>
        </Reveal>
        <h2 className="mx-auto mt-8 max-w-5xl font-display text-[clamp(3rem,8.5vw,7.5rem)] leading-[0.98] tracking-[-0.02em] text-[#fcfcf7]">
          <Reveal delay={0.12}>
            <CmsText field="contact.final.title">What will we </CmsText>
            <em className="glow-violet italic text-[#c5b0ff]">
              <CmsText field="contact.final.accent">build next?</CmsText>
            </em>
          </Reveal>
        </h2>
        <Reveal delay={0.3} className="mt-12">
          <Magnetic>
            <a href={`tel:${BRAND.phones[0].href.replace('tel:', '')}`} className="btn-ghost sheen px-8 py-4 text-sm">
              Call Thinklab — {BRAND.phones[0].label}
            </a>
          </Magnetic>
        </Reveal>
      </section>
      </div>
    </>
  )}</CmsPage>;
}
