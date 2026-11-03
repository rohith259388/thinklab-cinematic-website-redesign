'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { CmsText } from '@/components/cms/Canvas';
import { TESTIMONIALS } from '@/lib/content';

/**
 * Vertical continuous infinite scrolling testimonials component
 * Matches the reference design and physics from thinklabdigitalsolutions.com
 */
export default function VerticalTestimonials() {
  // Duplicate array to ensure perfectly seamless infinite looping
  const items = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <div className="relative w-full max-w-2xl mx-auto mt-16 px-4">
      <style>{`
        @keyframes verticalScrollUp {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        .vertical-marquee-track {
          animation: verticalScrollUp 32s linear infinite;
          will-change: transform;
        }
        .vertical-marquee-container:hover .vertical-marquee-track {
          animation-play-state: paused;
        }
      `}</style>

      {/* 1. Large Faint Watermark Heading in Background */}
      <div
        className="pointer-events-none absolute -top-14 md:-top-20 left-1/2 -translate-x-1/2 z-0 select-none whitespace-nowrap text-center opacity-20"
        aria-hidden="true"
      >
        <span
          className="font-black text-5xl sm:text-7xl md:text-8xl tracking-[0.22em] text-white/40 block"
          style={{
            fontFamily: '"Thinklab Sans", "Unbounded", system-ui, sans-serif',
            WebkitTextStroke: '1px rgba(255, 255, 255, 0.35)',
            color: 'transparent',
          }}
        >
          TESTIMONIAL
        </span>
      </div>

      {/* Atmospheric purple glow in the center */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[110px] opacity-25 z-0"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, rgba(24, 10, 64, 0.2) 60%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* 2. Vertical Ticker Container with Top & Bottom Fade Masks */}
      <div
        className="vertical-marquee-container relative z-10 w-full h-[620px] md:h-[680px] overflow-hidden rounded-[28px]"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)',
        }}
      >
        {/* Continuous upward scrolling track */}
        <div className="vertical-marquee-track flex flex-col gap-5 py-4">
          {items.map((t, idx) => {
            const originalIndex = idx % TESTIMONIALS.length;
            return (
              <figure
                key={`${t.name}-${idx}`}
                className="group relative w-full rounded-[22px] bg-[#0c0c11]/85 border border-white/[0.14] p-6 md:p-7 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-[#8b5cf6]/60 hover:bg-[#12101c]/90"
              >
                {/* 5-Star Rating */}
                <div className="flex items-center gap-1.5 text-amber-400 mb-3.5">
                  {[...Array(5)].map((_, sIdx) => (
                    <Star key={sIdx} size={15} fill="currentColor" stroke="none" />
                  ))}
                </div>

                {/* Quote with Background Purple SVG Watermark */}
                <div className="relative mb-5">
                  <svg
                    className="absolute -top-3.5 -left-2 w-9 h-9 text-[#a280ff]/30 pointer-events-none group-hover:text-[#a280ff]/45 transition-colors"
                    viewBox="0 0 55 55"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M 8.459 14.419 C 11.674 10.934 16.539 9.167 22.919 9.167 L 25.211 9.167 L 25.211 15.627 L 23.366 15.996 C 20.226 16.624 18.042 17.859 16.874 19.672 C 16.264 20.648 15.918 21.766 15.87 22.917 L 22.917 22.917 C 24.182 22.917 25.208 23.943 25.208 25.208 L 25.208 41.25 C 25.208 43.778 23.153 45.833 20.625 45.833 L 6.875 45.833 C 5.609 45.833 4.583 44.807 4.583 43.542 L 4.583 32.083 L 4.59 25.394 C 4.57 25.14 4.134 19.112 8.459 14.419 Z M 45.836 45.833 L 32.086 45.833 C 30.82 45.833 29.794 44.807 29.794 43.542 L 29.794 32.083 L 29.799 25.394 C 29.778 25.14 29.343 19.112 33.667 14.419 C 36.882 10.934 41.747 9.167 48.127 9.167 L 50.419 9.167 L 50.419 15.627 L 48.574 15.996 C 45.435 16.624 43.251 17.859 42.082 19.672 C 41.472 20.648 41.126 21.766 41.078 22.917 L 48.125 22.917 C 49.391 22.917 50.417 23.943 50.417 25.208 L 50.417 41.25 C 50.417 43.778 48.361 45.833 45.833 45.833 Z" />
                  </svg>
                  <blockquote className="relative z-10 text-[#fcfcf7] text-[14px] md:text-[15px] leading-relaxed font-light pl-6">
                    “<CmsText field={`home.review.${originalIndex}.quote`}>{t.quote}</CmsText>”
                  </blockquote>
                </div>

                {/* Divider Line */}
                <figcaption className="border-t border-white/[0.12] pt-4 flex flex-col">
                  <div className="font-semibold text-white text-[15px] tracking-wide">
                    <CmsText field={`home.review.${originalIndex}.name`}>{t.name}</CmsText>
                  </div>
                  <div className="text-[11px] font-mono font-bold tracking-widest text-white/50 uppercase mt-0.5">
                    <CmsText field={`home.review.${originalIndex}.role`}>{t.role}</CmsText>{' '}
                    <span className="text-white/30">•</span>{' '}
                    <CmsText field={`home.review.${originalIndex}.company`}>{t.company}</CmsText>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </div>
  );
}
