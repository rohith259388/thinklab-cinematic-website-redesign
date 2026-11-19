'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { CmsText } from '@/components/cms/Canvas';
import { TESTIMONIALS } from '@/lib/content';

/**
 * Continuous infinite horizontal scrolling testimonials component
 * Styled to perfectly match Thinklab's paper/ink studio theme
 */
export default function VerticalTestimonials() {
  // Duplicate array to ensure seamless infinite horizontal looping
  const items = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <div className="relative w-full mt-14 overflow-hidden">
      <style>{`
        @keyframes horizontalScrollLeft {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .horizontal-marquee-track {
          display: flex;
          width: max-content;
          animation: horizontalScrollLeft 38s linear infinite;
          will-change: transform;
        }
        .horizontal-marquee-container:hover .horizontal-marquee-track {
          animation-play-state: paused;
        }
      `}</style>

      {/* Subtle ambient brand tint */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[100px] opacity-15 z-0"
        style={{
          background: 'radial-gradient(circle, rgba(126, 111, 240, 0.2) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Horizontal Ticker Container with Left & Right Gradient Fade Masks */}
      <div
        className="horizontal-marquee-container relative z-10 w-full overflow-hidden py-4"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
        }}
      >
        {/* Continuous horizontal scrolling track */}
        <div className="horizontal-marquee-track flex flex-row gap-5 px-4">
          {items.map((t, idx) => {
            const originalIndex = idx % TESTIMONIALS.length;
            return (
              <figure
                key={`${t.name}-${idx}`}
                className="group relative w-[320px] sm:w-[380px] md:w-[420px] flex-shrink-0 flex flex-col justify-between rounded-[22px] bg-white/85 border border-[#27291d]/12 p-6 md:p-7 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-[#7e6ff0]/50 hover:bg-white hover:shadow-md"
              >
                <div>
                  {/* 5-Star Rating */}
                  <div className="flex items-center gap-1.5 text-amber-500 mb-3.5">
                    {[...Array(5)].map((_, sIdx) => (
                      <Star key={sIdx} size={14} fill="currentColor" stroke="none" />
                    ))}
                  </div>

                  {/* Quote with Compact Double Quote Icon */}
                  <div className="flex items-start gap-2.5 mb-5">
                    <svg
                      className="w-4 h-4 text-[#7e6ff0] flex-shrink-0 mt-1 opacity-80 group-hover:opacity-100 transition-opacity"
                      viewBox="0 0 55 55"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M 8.459 14.419 C 11.674 10.934 16.539 9.167 22.919 9.167 L 25.211 9.167 L 25.211 15.627 L 23.366 15.996 C 20.226 16.624 18.042 17.859 16.874 19.672 C 16.264 20.648 15.918 21.766 15.87 22.917 L 22.917 22.917 C 24.182 22.917 25.208 23.943 25.208 25.208 L 25.208 41.25 C 25.208 43.778 23.153 45.833 20.625 45.833 L 6.875 45.833 C 5.609 45.833 4.583 44.807 4.583 43.542 L 4.583 32.083 L 4.59 25.394 C 4.57 25.14 4.134 19.112 8.459 14.419 Z M 45.836 45.833 L 32.086 45.833 C 30.82 45.833 29.794 44.807 29.794 43.542 L 29.794 32.083 L 29.799 25.394 C 29.778 25.14 29.343 19.112 33.667 14.419 C 36.882 10.934 41.747 9.167 48.127 9.167 L 50.419 9.167 L 50.419 15.627 L 48.574 15.996 C 45.435 16.624 43.251 17.859 42.082 19.672 C 41.472 20.648 41.126 21.766 41.078 22.917 L 48.125 22.917 C 49.391 22.917 50.417 23.943 50.417 25.208 L 50.417 41.25 C 50.417 43.778 48.361 45.833 45.833 45.833 Z" />
                    </svg>
                    <blockquote className="text-[#20211f] text-[14px] md:text-[14.5px] leading-relaxed font-normal">
                      “<CmsText field={`home.review.${originalIndex}.quote`}>{t.quote}</CmsText>”
                    </blockquote>
                  </div>
                </div>

                {/* Divider Line & Reviewer Details */}
                <figcaption className="border-t border-[#27291d]/10 pt-3.5 flex flex-col mt-4">
                  <div className="font-semibold text-[#1a1b18] text-[14.5px] tracking-wide">
                    <CmsText field={`home.review.${originalIndex}.name`}>{t.name}</CmsText>
                  </div>
                  <div className="text-[11px] font-mono font-medium tracking-widest text-[#686b61] uppercase mt-0.5">
                    <CmsText field={`home.review.${originalIndex}.role`}>{t.role}</CmsText>{' '}
                    <span className="text-[#686b61]/40">•</span>{' '}
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
