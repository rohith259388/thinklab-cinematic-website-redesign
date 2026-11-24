'use client';

import { useRef, useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { CmsText } from '@/components/cms/Canvas';
import { TESTIMONIALS } from '@/lib/content';

/**
 * Modern Horizontal Auto-Scrolling Testimonials Carousel.
 * Replaces the 3D cylindrical ring with a smooth, continuous horizontal
 * marquee ticker with pause-on-hover, drag/touch capability, and no page pinning.
 */
export default function VerticalTestimonials() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Triple array to ensure infinite seamless loop
  const loopItems = [...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS];

  // Drag to scroll handlers for desktop mouse & touch
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="relative w-full overflow-hidden py-6 md:py-10 select-none">
      <style jsx>{`
        @keyframes scrollMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 3));
          }
        }
        .animate-testimonial-scroll {
          animation: scrollMarquee 38s linear infinite;
        }
        .paused-animation {
          animation-play-state: paused !important;
        }
      `}</style>

      {/* Subtle edge fade gradients */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 md:w-28 z-20 bg-gradient-to-r from-[var(--studio-paper,#f0f0e9)] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 md:w-28 z-20 bg-gradient-to-l from-[var(--studio-paper,#f0f0e9)] to-transparent" />

      {/* Marquee Track */}
      <div
        ref={scrollContainerRef}
        className="w-full flex cursor-grab active:cursor-grabbing overflow-x-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          setIsDragging(false);
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          className={`flex gap-6 md:gap-7 items-stretch w-max will-change-transform ${
            isPaused || isDragging ? 'paused-animation' : 'animate-testimonial-scroll'
          }`}
        >
          {loopItems.map((t, idx) => {
            const originalIndex = idx % TESTIMONIALS.length;
            return (
              <figure
                key={`${t.name}-${idx}`}
                className="w-[310px] sm:w-[370px] md:w-[420px] flex-shrink-0 flex flex-col justify-between rounded-2xl md:rounded-3xl bg-white border border-[#27291d]/12 p-6 md:p-8 shadow-[0_10px_35px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_-15px_rgba(126,111,240,0.18)] hover:border-[#7e6ff0]/50 transition-all duration-300 group"
              >
                <div>
                  {/* 5-Star Rating */}
                  <div className="flex items-center gap-1.5 text-amber-500 mb-4">
                    {[...Array(5)].map((_, sIdx) => (
                      <Star key={sIdx} size={15} fill="currentColor" stroke="none" />
                    ))}
                  </div>

                  {/* Quote with quote mark */}
                  <div className="flex items-start gap-3 mb-6">
                    <svg
                      className="w-4 h-4 text-[#7e6ff0] flex-shrink-0 mt-1 opacity-70 group-hover:opacity-100 transition-opacity"
                      viewBox="0 0 55 55"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M 8.459 14.419 C 11.674 10.934 16.539 9.167 22.919 9.167 L 25.211 9.167 L 25.211 15.627 L 23.366 15.996 C 20.226 16.624 18.042 17.859 16.874 19.672 C 16.264 20.648 15.918 21.766 15.87 22.917 L 22.917 22.917 C 24.182 22.917 25.208 23.943 25.208 25.208 L 25.208 41.25 C 25.208 43.778 23.153 45.833 20.625 45.833 L 6.875 45.833 C 5.609 45.833 4.583 44.807 4.583 43.542 L 4.583 32.083 L 4.59 25.394 C 4.57 25.14 4.134 19.112 8.459 14.419 Z M 45.836 45.833 L 32.086 45.833 C 30.82 45.833 29.794 44.807 29.794 43.542 L 29.794 32.083 L 29.799 25.394 C 29.778 25.14 29.343 19.112 33.667 14.419 C 36.882 10.934 41.747 9.167 48.127 9.167 L 50.419 9.167 L 50.419 15.627 L 48.574 15.996 C 45.435 16.624 43.251 17.859 42.082 19.672 C 41.472 20.648 41.126 21.766 41.078 22.917 L 48.125 22.917 C 49.391 22.917 50.417 23.943 50.417 25.208 L 50.417 41.25 C 50.417 43.778 48.361 45.833 45.833 45.833 Z" />
                    </svg>
                    <blockquote className="text-[#20211f] text-[14.5px] md:text-[15px] leading-relaxed font-normal">
                      “<CmsText field={`home.review.${originalIndex}.quote`}>{t.quote}</CmsText>”
                    </blockquote>
                  </div>
                </div>

                {/* Reviewer Details */}
                <figcaption className="border-t border-[#27291d]/10 pt-4 flex flex-col mt-auto">
                  <div className="font-semibold text-[#1a1b18] text-[15px] tracking-wide">
                    <CmsText field={`home.review.${originalIndex}.name`}>{t.name}</CmsText>
                  </div>
                  <div className="text-[11px] font-mono font-medium tracking-wider text-[#686b61] uppercase mt-1">
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
