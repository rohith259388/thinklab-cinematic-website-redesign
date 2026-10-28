import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, Check, Code2, Compass, Database, Megaphone, Quote, Star, Workflow, Fingerprint,
} from 'lucide-react';
import {
  BRAND, SERVICES, STATS, FEATURES, CHECKLIST, CASE_STUDIES, TESTIMONIALS, WHY_US, BLOGS, HOME_FAQS, CTA,
} from '@/lib/content';
import StageSetter from '@/components/experience/StageSetter';
import HomeJourney from '@/components/home/HomeJourney';
import SectionIntro from '@/components/ui/SectionIntro';
import Accordion from '@/components/ui/Accordion';
import Magnetic from '@/components/ui/Magnetic';
import { Reveal, CountUp, EnergyLine } from '@/components/ui/Reveal';

export const metadata: Metadata = {
  title: 'Thinklab Digital Solutions — The Right Partner For Digital Growth',
  description: BRAND.descriptor,
  alternates: { canonical: '/' },
};

const SERVICE_ICONS = [Megaphone, Code2, Fingerprint, Workflow, Database, Compass];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Thinklab Digital Solutions',
  url: 'https://www.thinklabdigitalsolutions.com/',
  description: BRAND.descriptor,
  telephone: ['+61 493 305 496', '+91 9347580911'],
  address: [
    { '@type': 'PostalAddress', addressLocality: 'Vijayawada', addressRegion: 'AP', addressCountry: 'IN' },
    { '@type': 'PostalAddress', addressLocality: 'Mascot', addressRegion: 'Sydney', addressCountry: 'AU' },
  ],
  sameAs: [],
};

export default function HomePage() {
  return (
    <>
      <StageSetter page="home" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* SCENES 01–04: The pinned cinematic journey */}
      <HomeJourney />

      {/* The organism recedes behind frosted dusk — but never dies. */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[38vh] bg-gradient-to-b from-transparent to-[#050505]/95" />
        <div className="relative bg-[#050505]/95">

          {/* ——— SERVICES — every service a chamber, not a card ——— */}
          <section id="services" className="mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-36" aria-label="Services">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <SectionIntro
                kicker="Services"
                title="How We Help Your"
                accent="Business Grow"
                body="From SEO and paid ads to branding and automation, we create strategies focused on measurable business growth."
              />
              <Reveal delay={0.2}>
                <Link href="/services" className="btn-ghost sheen mb-2 px-6 py-3 text-[13px]">
                  {CTA.services}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Reveal>
            </div>

            <div className="mt-14 border-t border-[rgba(197,176,255,0.09)]">
              {SERVICES.map((s, i) => {
                const Icon = SERVICE_ICONS[i];
                return (
                  <Reveal key={s.id} y={28} delay={Math.min(i * 0.05, 0.2)}>
                    <Link
                      href={`/services#${s.id}`}
                      className="group relative grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-2 border-b border-[rgba(197,176,255,0.09)] py-7 transition-colors duration-500 hover:bg-[rgba(126,111,240,0.045)] md:grid-cols-[64px_40px_1.1fr_1fr_40px] md:gap-x-8 md:py-9"
                    >
                      <span className="font-mono text-[11px] tracking-[0.2em] text-[#545454] transition-colors group-hover:text-[#a280ff]">
                        {s.index}
                      </span>
                      <Icon className="hidden h-5 w-5 text-[#7e6ff0] opacity-70 transition-all duration-500 group-hover:opacity-100 md:block" />
                      <span>
                        <span className="font-display text-[26px] tracking-tight text-[#f4f2fa] transition-all duration-500 group-hover:translate-x-2 group-hover:text-[#fcfcf7] md:text-[38px] md:inline-block">
                          {s.title}
                        </span>
                        <span className="mt-1 block font-mono text-[9.5px] tracking-[0.3em] text-[#7e6ff0] uppercase opacity-0 transition-opacity duration-700 group-hover:opacity-100">
                          {s.layer}
                        </span>
                      </span>
                      <span className="col-span-2 max-w-md text-[13.5px] leading-relaxed text-[#9a97a8] md:col-span-1">
                        {s.description}
                      </span>
                      <ArrowUpRight className="hidden h-5 w-5 justify-self-end text-[#545454] transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#c5b0ff] md:block" />
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </section>

          {/* ——— STATS — proof rendered as light ——— */}
          <section className="border-y border-[rgba(197,176,255,0.08)] bg-[rgba(24,10,64,0.14)]">
            <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-px lg:grid-cols-4">
              {STATS.map((s, i) => (
                <div key={s.label} className="relative px-6 py-12 md:px-10 md:py-16">
                  <Reveal delay={i * 0.08}>
                    <p className="font-display text-5xl tracking-tight text-[#fcfcf7] md:text-6xl">
                      <CountUp end={s.value} prefix={s.prefix ?? ''} suffix={s.suffix ?? ''} />
                    </p>
                    <p className="mt-3 font-mono text-[10.5px] tracking-[0.28em] text-[#9a97a8] uppercase">{s.label}</p>
                    <span className="energy-line absolute bottom-0 left-6 right-6 md:left-10 md:right-10" />
                  </Reveal>
                </div>
              ))}
            </div>
          </section>

          {/* ——— APPROACH TRIO + CHECKLIST ——— */}
          <section className="mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-36">
            <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
              <div>
                <SectionIntro kicker="The Method" title="Delivering measurable business outcomes" accent="through data" />
                <Reveal delay={0.3} className="mt-8">
                  <ul className="space-y-3.5">
                    {CHECKLIST.map((c) => (
                      <li key={c} className="flex items-center gap-3 text-[15px] text-[#c9c7d4]">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(162,128,255,0.4)] bg-[rgba(126,111,240,0.1)]">
                          <Check className="h-3 w-3 text-[#c5b0ff]" />
                        </span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
              <div className="grid gap-5 sm:grid-cols-1">
                {FEATURES.map((f, i) => (
                  <Reveal key={f.title} delay={i * 0.1}>
                    <article className="glass sheen group flex gap-6 p-7 transition-transform duration-700 hover:-translate-y-1 md:p-9">
                      <span className="font-display text-4xl italic text-[rgba(162,128,255,0.55)] md:text-5xl">0{i + 1}</span>
                      <span>
                        <h3 className="font-display text-[22px] tracking-tight text-[#fcfcf7] md:text-2xl">{f.title}</h3>
                        <p className="mt-3 text-[14px] leading-relaxed text-[#9a97a8]">{f.description}</p>
                      </span>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ——— CASE STUDIES — pathways of light ——— */}
          <section id="works" className="mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-32" aria-label="Case Studies">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <SectionIntro kicker="Works" title="Case Studies that" accent="carry the current" />
              <Reveal delay={0.2}>
                <Link href="/projects" className="btn-ghost sheen mb-2 px-6 py-3 text-[13px]">
                  {CTA.projects}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Reveal>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {CASE_STUDIES.map((cs, i) => (
                <Reveal key={cs.id} delay={(i % 2) * 0.12}>
                  <Link
                    href={`/projects#${cs.id}`}
                    className="glass sheen group flex h-full flex-col justify-between p-7 transition-all duration-700 hover:-translate-y-1.5 hover:border-[rgba(162,128,255,0.35)] md:p-10"
                  >
                    <span>
                      <span className="flex items-baseline justify-between">
                        <span className="text-outline font-display text-6xl md:text-7xl">{cs.index}</span>
                        <span className="font-mono text-[9.5px] tracking-[0.28em] text-[#7e6ff0] uppercase">{cs.sector}</span>
                      </span>
                      <span className="mt-7 block font-mono text-[10px] tracking-[0.3em] text-[#9a97a8] uppercase">{cs.client}</span>
                      <span className="mt-3 block font-display text-[24px] leading-snug tracking-tight text-[#fcfcf7] md:text-[27px]">
                        {cs.title}
                      </span>
                      <span className="mt-4 block text-[13.5px] leading-relaxed text-[#9a97a8]">{cs.summary}</span>
                    </span>
                    <span className="mt-8 flex items-center gap-2 font-mono text-[10px] tracking-[0.26em] text-[#a280ff] uppercase opacity-70 transition-opacity group-hover:opacity-100">
                      Follow the pathway
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1.5" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ——— TESTIMONIALS ——— */}
          <section id="reviews" className="border-y border-[rgba(197,176,255,0.08)] bg-[rgba(13,13,13,0.6)] py-24 md:py-32">
            <div className="mx-auto max-w-[1500px] px-5 md:px-10">
              <div className="flex flex-wrap items-end justify-between gap-8">
                <SectionIntro kicker="Testimonial" title="What partners feel" accent="inside the laboratory" />
                <Reveal delay={0.2}>
                  <div className="mb-2 flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#e4c390] text-[#e4c390]" />
                    ))}
                    <span className="ml-2 font-mono text-[10px] tracking-[0.22em] text-[#9a97a8] uppercase">200+ 5 Star Reviews</span>
                  </div>
                </Reveal>
              </div>
              <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {TESTIMONIALS.map((t, i) => (
                  <Reveal key={t.name} delay={(i % 3) * 0.09}>
                    <figure className="glass sheen flex h-full flex-col p-7 md:p-8">
                      <Quote className="h-5 w-5 text-[#7e6ff0]" />
                      <blockquote className="mt-5 flex-1 text-[14.5px] leading-relaxed text-[#c9c7d4]">{t.quote}</blockquote>
                      <figcaption className="mt-7 flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(197,176,255,0.25)] bg-[rgba(24,10,64,0.5)] font-display text-sm text-[#c5b0ff]">
                          {t.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                        <span>
                          <span className="block text-[14px] font-medium text-[#fcfcf7]">{t.name}</span>
                          <span className="block font-mono text-[9.5px] tracking-[0.22em] text-[#9a97a8] uppercase">{t.role}</span>
                        </span>
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ——— WHY US ——— */}
          <section className="mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-36">
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
              <SectionIntro kicker={WHY_US.kicker} title="Why Thinklab Digital Solutions" accent="Stands Out" body={WHY_US.body} />
              <div>
                <Reveal delay={0.2}>
                  <div className="glass sheen p-7 md:p-9">
                    <p className="font-mono text-[10px] tracking-[0.3em] text-[#e4c390] uppercase">Enhanced Brand Visibility</p>
                    <p className="mt-4 text-[14.5px] leading-relaxed text-[#c9c7d4]">{WHY_US.visibility}</p>
                    <div className="hairline my-7" />
                    <p className="font-mono text-[13px] tracking-wide text-[#a280ff]">$250K+ Revenue Generated</p>
                  </div>
                </Reveal>
                <div className="mt-8 flex flex-wrap gap-2.5">
                  {WHY_US.values.map((v, i) => (
                    <Reveal key={v} delay={Math.min(i * 0.04, 0.4)} y={14}>
                      <span className="chapter-chip inline-block rounded-full px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-[#c9c7d4] transition-colors hover:text-[#fcfcf7] hover:border-[rgba(162,128,255,0.45)]">
                        {v}
                      </span>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ——— BLOG ——— */}
          <section className="mx-auto max-w-[1500px] px-5 py-24 md:px-10 md:py-32" aria-label="Blog">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <SectionIntro kicker="Blogs" title="Dive into our collection of" accent="engaging blog posts" />
              <Reveal delay={0.2}>
                <Link href="/blog" className="btn-ghost sheen mb-2 px-6 py-3 text-[13px]">
                  {CTA.blogs}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Reveal>
            </div>
            <div className="mt-14 border-t border-[rgba(197,176,255,0.09)]">
              {BLOGS.slice(0, 4).map((b, i) => (
                <Reveal key={b.title} y={24} delay={i * 0.05}>
                  <Link href="/blog" className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[rgba(197,176,255,0.09)] py-6 transition-colors hover:bg-[rgba(126,111,240,0.045)] md:grid-cols-[110px_120px_1fr_auto] md:gap-8 md:px-2 md:py-8">
                    <span className="hidden font-mono text-[10.5px] tracking-[0.18em] text-[#545454] md:block">{b.date}</span>
                    <span className="hidden font-mono text-[9.5px] tracking-[0.24em] text-[#7e6ff0] uppercase md:block">{b.tag}</span>
                    <span className="text-[16px] font-medium tracking-tight text-[#e9e3dc] transition-colors duration-500 group-hover:text-[#fcfcf7] md:text-[19px]">
                      {b.title}
                    </span>
                    <ArrowUpRight className="h-4.5 w-4.5 text-[#545454] transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#c5b0ff]" />
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ——— FAQ ——— */}
          <section className="mx-auto max-w-[1100px] px-5 py-24 md:px-10 md:py-32" aria-label="Frequently Asked Questions">
            <SectionIntro kicker="Frequently Asked Questions" title="Add Service Related" accent="FAQs Here" align="center" />
            <div className="mt-14">
              <Accordion items={HOME_FAQS} />
            </div>
          </section>

          {/* ——— FINAL TRANSMISSION ——— */}
          <section className="relative overflow-hidden px-5 py-28 text-center md:py-40">
            <EnergyLine className="absolute left-1/2 top-0 w-[min(720px,80vw)] -translate-x-1/2" />
            <Reveal>
              <p className="font-mono text-[10.5px] tracking-[0.44em] text-[#a280ff] uppercase">The cycle completes · a new spark forms</p>
            </Reveal>
            <h2 className="mx-auto mt-8 max-w-5xl font-display text-[clamp(2.6rem,7vw,6rem)] leading-[1.02] tracking-tight text-[#fcfcf7]">
              <Reveal delay={0.1}>
                What will we <em className="italic text-[#c5b0ff]">build next?</em>
              </Reveal>
            </h2>
            <Reveal delay={0.25} className="mx-auto mt-6 max-w-xl text-[15.5px] leading-relaxed text-[#9a97a8]">
              Every engagement begins as a single molten spark. Bring yours — the laboratory is warm.
            </Reveal>
            <Reveal delay={0.35} className="mt-10">
              <Magnetic>
                <Link href="/contact" className="btn-drop sheen px-9 py-4 text-[15px] font-medium">
                  {CTA.contact}
                  <ArrowUpRight className="h-4.5 w-4.5" />
                </Link>
              </Magnetic>
            </Reveal>
            <Reveal delay={0.45} className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {BRAND.phones.map((p) => (
                <a key={p.href} href={p.href} className="font-mono text-[11px] tracking-[0.2em] text-[#9a97a8] transition-colors hover:text-[#c5b0ff]">
                  {p.label}
                </a>
              ))}
              <span className="font-mono text-[11px] tracking-[0.18em] text-[#545454]">{BRAND.locations.join(' · ')}</span>
            </Reveal>
          </section>
        </div>
      </div>
    </>
  );
}
