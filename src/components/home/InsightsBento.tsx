'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Clock } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { CmsText } from '@/components/cms/Canvas';

export interface HomeInsightItem {
  title: string;
  date: string;
  tag: string;
  slug: string;
  image?: string;
  readTime?: string;
}

function CardImage({
  src,
  alt,
  className = '',
  sizes,
}: {
  src?: string;
  alt: string;
  className?: string;
  sizes: string;
}) {
  if (!src) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br from-[#2a1170] via-[#180a40] to-[#0b0a12] ${className}`}
        aria-hidden="true"
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized={src.startsWith('/api/cms-media/') || src.startsWith('http')}
      sizes={sizes}
      loading="lazy"
      className={`object-cover ${className}`}
    />
  );
}

/**
 * Editorial 5-card Asymmetric Bento Grid for Homepage Insights:
 *  - 01: Full-bleed dark obsidian spotlight (7 cols)
 *  - 02: Lilac architectural visual split card (5 cols)
 *  - 03..05: Tactile editorial cards with framed imagery & kinetic hover bar (4 cols each)
 */
export default function InsightsBento({ insights }: { insights: HomeInsightItem[] }) {
  const lead = insights[0];
  const secondary = insights[1];
  const rowTwo = insights.slice(2, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-6 mt-12">
      {/* 01 — HERO OBSIDIAN SPOTLIGHT (7 cols) */}
      {lead && (
        <Reveal delay={0.04} className="md:col-span-2 lg:col-span-7">
          <Link
            href={lead.slug ? `/blog/${lead.slug}` : '/blog'}
            className="group relative flex flex-col justify-between min-h-[380px] lg:min-h-[440px] h-full rounded-[28px] overflow-hidden bg-[#100e18] border border-white/10 p-6 md:p-8 shadow-[0_24px_60px_-20px_rgba(16,14,24,0.45)] transition-all duration-500 hover:border-[#7e6ff0]/60"
          >
            <div className="absolute inset-0 overflow-hidden">
              <CardImage
                src={lead.image}
                alt={lead.title}
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="transition-transform duration-700 ease-out group-hover:scale-105 opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09080f] via-[#09080f]/75 to-[#09080f]/25" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_bottom_right,rgba(126,111,240,0.32),transparent_60%)]" />
            </div>

            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] tracking-[0.18em] px-3 py-1 rounded-full bg-[#7e6ff0] text-white font-medium">
                  01 · FEATURED
                </span>
                <span className="font-mono text-[11px] px-3 py-1 rounded-full bg-white/12 text-white/90 backdrop-blur-md border border-white/15">
                  {lead.tag}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-white/75">
                {lead.date && <span>{lead.date}</span>}
                {lead.readTime && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {lead.readTime}
                  </span>
                )}
              </div>
            </div>

            <div className="relative z-10 mt-16 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <h3 className="text-2xl sm:text-[28px] lg:text-[32px] font-medium text-white leading-[1.14] tracking-[-0.025em] max-w-2xl group-hover:text-[#d0baff] transition-colors duration-300">
                <CmsText field="home.blog.0.title">{lead.title}</CmsText>
              </h3>
              <span className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-[#100e18] group-hover:bg-[#7e6ff0] group-hover:text-white group-hover:rotate-45 transition-all duration-500 shadow-lg">
                <ArrowUpRight size={20} />
              </span>
            </div>
          </Link>
        </Reveal>
      )}

      {/* 02 — ARCHITECTURAL LILAC FEATURE CARD (5 cols) */}
      {secondary && (
        <Reveal delay={0.1} className="md:col-span-1 lg:col-span-5">
          <Link
            href={secondary.slug ? `/blog/${secondary.slug}` : '/blog'}
            className="group flex flex-col justify-between h-full min-h-[380px] lg:min-h-[440px] rounded-[28px] bg-gradient-to-b from-[#ebe6fb] to-[#f8f7f3] border border-[#644be2]/20 p-5 md:p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[#644be2]/55 hover:shadow-[0_24px_48px_-16px_rgba(100,75,226,0.22)]"
          >
            <div>
              <div className="relative aspect-[16/10] w-full rounded-[20px] overflow-hidden bg-[#1a1628] mb-5">
                <CardImage
                  src={secondary.image}
                  alt={secondary.title}
                  sizes="(max-width: 1024px) 50vw, 38vw"
                  className="transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 font-mono text-[11px] tracking-[0.14em] px-2.5 py-1 rounded-full bg-[#100e18]/80 text-white backdrop-blur-md border border-white/15">
                  02
                </span>
                <span className="absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.08em] uppercase px-2.5 py-1 rounded-full bg-white/90 text-[#181524] font-medium">
                  {secondary.tag}
                </span>
              </div>

              <h3 className="text-xl lg:text-[23px] font-medium text-[#181720] leading-[1.22] tracking-[-0.02em] group-hover:text-[#573ed9] transition-colors">
                <CmsText field="home.blog.1.title">{secondary.title}</CmsText>
              </h3>
            </div>

            <div className="pt-5 mt-5 border-t border-[#27291d]/12 flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-mono text-[11px] text-[#5e5c6b]">
                {secondary.date && <span>{secondary.date}</span>}
                {secondary.date && secondary.readTime && <span>·</span>}
                {secondary.readTime && <span>{secondary.readTime}</span>}
              </div>
              <span className="inline-flex items-center gap-2 font-mono text-xs font-medium text-[#573ed9]">
                Read article
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#644be2]/30 group-hover:bg-[#644be2] group-hover:text-white group-hover:border-[#644be2] group-hover:rotate-45 transition-all duration-300">
                  <ArrowUpRight size={14} />
                </span>
              </span>
            </div>
          </Link>
        </Reveal>
      )}

      {/* 03, 04, 05 — TACTILE EDITORIAL TRIO (4 cols each) */}
      {rowTwo.map((blog, idx) => {
        const i = idx + 2;
        const numLabel = `0${i + 1}`;
        return (
          <Reveal key={blog.slug || blog.title} delay={0.12 + idx * 0.06} className="md:col-span-1 lg:col-span-4">
            <Link
              href={blog.slug ? `/blog/${blog.slug}` : '/blog'}
              className="group relative flex flex-col justify-between h-full rounded-[24px] bg-white/85 backdrop-blur-sm border border-[#27291d]/12 overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:border-[#7e6ff0]/50 hover:shadow-[0_22px_45px_-16px_rgba(100,75,226,0.18)]"
            >
              <div>
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#181524]">
                  <CardImage
                    src={blog.image}
                    alt={blog.title}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 32vw"
                    className="transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c14]/70 via-[#0d0c14]/15 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="font-mono text-[11px] tracking-[0.14em] px-2.5 py-0.5 rounded-full bg-[#0d0c14]/75 text-white backdrop-blur-md border border-white/15">
                      {numLabel}
                    </span>
                    {blog.readTime && (
                      <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-white/15 text-white backdrop-blur-md">
                        {blog.readTime}
                      </span>
                    )}
                  </div>
                  <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.08em] px-2.5 py-0.5 rounded-full bg-[#c5b0ff] text-[#180a40] font-medium">
                    {blog.tag}
                  </span>
                </div>

                {/* Kinetic violet progress divider */}
                <div className="relative h-[2px] w-full bg-[#27291d]/8 overflow-hidden">
                  <div className="h-full w-0 bg-gradient-to-r from-[#644be2] to-[#a280ff] group-hover:w-full transition-all duration-500 ease-out" />
                </div>

                <div className="p-5 pb-2">
                  <h3 className="text-[18px] font-medium text-[#181720] leading-[1.3] tracking-[-0.015em] group-hover:text-[#573ed9] transition-colors">
                    <CmsText field={`home.blog.${i}.title`}>{blog.title}</CmsText>
                  </h3>
                </div>
              </div>

              <div className="px-5 pb-5 pt-4 flex items-center justify-between text-xs font-mono">
                <span className="text-[#71736d]">{blog.date || 'Thinklab Journal'}</span>
                <span className="inline-flex items-center gap-1.5 text-[#573ed9] font-medium">
                  Explore
                  <ArrowUpRight
                    size={15}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
