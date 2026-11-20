'use client';

import { useEffect, useRef } from 'react';
import { Star } from 'lucide-react';
import { CmsText } from '@/components/cms/Canvas';
import { TESTIMONIALS } from '@/lib/content';
import { ensureGsap } from '@/lib/gsap';

/** How much wider than "cards edge to edge" the ring is (1 = cards touching). */
const RING_SPREAD = 1.55;
/** Downward camera tilt (deg) so the back of the ring shows above the front. */
const RING_TILT = -9;
/** Scroll distance per card, as a fraction of the viewport height. */
const SCROLL_PER_CARD = 0.55;
/** Opacity of the card directly behind the ring (180° from the front). */
const BACK_OPACITY = 0.4;
/** Angle from the front at which a card's text has fully faded (its back faces us after 90°). */
const TEXT_FADE_DEG = 100;

/**
 * Scroll-driven 3D testimonial ring.
 * The parent <section> pins when it reaches the viewport; scrolling rotates the
 * ring until the last card faces the viewer, then the page scrolls on normally.
 */
export default function VerticalTestimonials() {
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);

  const count = TESTIMONIALS.length;
  const step = 360 / count;

  useEffect(() => {
    const { gsap, ScrollTrigger } = ensureGsap();
    const stage = stageRef.current;
    const ring = ringRef.current;
    const section = stage?.closest('section');
    if (!stage || !ring || !section || count < 2) return;

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const cards = cardsRef.current.filter(Boolean) as HTMLElement[];
      const state = { angle: 0 };
      let radius = 0;

      const render = () => {
        ring.style.transform = `translateZ(${-radius}px) rotateX(${RING_TILT}deg) rotateY(${state.angle}deg)`;
        cards.forEach((card, i) => {
          // Angle of this card relative to the front, normalised to [-180, 180)
          const rel = ((((i * step + state.angle) % 360) + 540) % 360) - 180;
          const dist = Math.abs(rel);
          // Whole card dims gradually toward the back but never disappears
          const opacity = 1 - (1 - BACK_OPACITY) * Math.pow(dist / 180, 1.2);
          // Text fades out before the card turns its back, so it never reads mirrored
          const face = Math.sqrt(Math.max(0, (TEXT_FADE_DEG - dist) / TEXT_FADE_DEG));
          card.style.opacity = opacity.toFixed(3);
          card.style.setProperty('--tr-face', face.toFixed(3));
          card.style.pointerEvents = dist < step / 2 ? 'auto' : 'none';
        });
      };

      // Size the ring from the real card dimensions (re-run on every refresh/resize)
      const layout = () => {
        cards.forEach((card) => (card.style.height = 'auto'));
        const width = cards[0].offsetWidth;
        const height = Math.max(...cards.map((card) => card.offsetHeight));
        radius = (width / 2 / Math.tan(Math.PI / count)) * RING_SPREAD;
        stage.style.height = `${height}px`;
        cards.forEach((card, i) => {
          card.style.height = `${height}px`;
          card.style.left = `${-width / 2}px`;
          card.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`;
        });
        render();
      };

      layout();
      ScrollTrigger.addEventListener('refreshInit', layout);

      gsap.to(state, {
        angle: -(count - 1) * step, // stop when the last card faces front
        ease: 'none',
        onUpdate: render,
        scrollTrigger: {
          trigger: section,
          pin: section,
          // Keep the whole ring on screen even if the section is taller than the viewport
          start: () => (section.offsetHeight >= window.innerHeight ? 'bottom bottom' : 'center center'),
          end: () => `+=${(count - 1) * window.innerHeight * SCROLL_PER_CARD}`,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      ScrollTrigger.refresh();

      return () => {
        ScrollTrigger.removeEventListener('refreshInit', layout);
        stage.style.height = '';
        ring.style.transform = '';
        cards.forEach((card) => {
          card.style.cssText = '';
        });
      };
    });

    return () => mm.revert();
  }, [count, step]);

  return (
    <div className="relative w-full mt-14">
      <style>{`
        .tr-viewport {
          overflow-x: clip;
          mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
        }
        .tr-stage {
          --tr-r: 400px;
          position: relative;
          min-height: 320px;
          perspective: 1300px;
          perspective-origin: 50% 40%;
        }
        @media (min-width: 768px) { .tr-stage { --tr-r: 560px; perspective: 1900px; } }
        .tr-ring {
          position: absolute;
          top: 0;
          left: 50%;
          width: 0;
          height: 100%;
          transform-style: preserve-3d;
          transform: translateZ(calc(var(--tr-r) * -1)) rotateX(${RING_TILT}deg);
          will-change: transform;
        }
        .tr-card {
          position: absolute;
          top: 0;
          left: -150px;
          will-change: transform, opacity;
        }
        .tr-card > * { opacity: var(--tr-face, 1); }
        @media (min-width: 768px) { .tr-card { left: -210px; } }

        /* Reduced motion: plain horizontally scrollable row, no pin or 3D */
        @media (prefers-reduced-motion: reduce) {
          .tr-viewport { overflow-x: auto; mask-image: none; -webkit-mask-image: none; }
          .tr-stage { perspective: none; min-height: 0; }
          .tr-ring { position: static; display: flex; gap: 20px; width: max-content; height: auto; transform: none; padding: 0 16px; }
          .tr-card { position: static; transform: none !important; }
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

      <div className="tr-viewport relative z-10 w-full pt-10 pb-6 md:pt-12 md:pb-8">
        <div ref={stageRef} className="tr-stage">
          <div ref={ringRef} className="tr-ring">
            {TESTIMONIALS.map((t, idx) => (
              <figure
                key={`${t.name}-${idx}`}
                ref={(el) => {
                  cardsRef.current[idx] = el;
                }}
                className="tr-card group w-[300px] md:w-[420px] flex-shrink-0 flex flex-col justify-between rounded-[22px] bg-[#fcfcfa] border border-[#27291d]/12 p-6 md:p-7 shadow-sm transition-[background-color,border-color,box-shadow] duration-300 hover:border-[#7e6ff0]/50 hover:bg-white hover:shadow-md"
                style={{ transform: `rotateY(${idx * step}deg) translateZ(var(--tr-r))` }}
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
                      “<CmsText field={`home.review.${idx}.quote`}>{t.quote}</CmsText>”
                    </blockquote>
                  </div>
                </div>

                {/* Divider Line & Reviewer Details */}
                <figcaption className="border-t border-[#27291d]/10 pt-3.5 flex flex-col mt-4">
                  <div className="font-semibold text-[#1a1b18] text-[14.5px] tracking-wide">
                    <CmsText field={`home.review.${idx}.name`}>{t.name}</CmsText>
                  </div>
                  <div className="text-[11px] font-mono font-medium tracking-widest text-[#686b61] uppercase mt-0.5">
                    <CmsText field={`home.review.${idx}.role`}>{t.role}</CmsText>{' '}
                    <span className="text-[#686b61]/40">•</span>{' '}
                    <CmsText field={`home.review.${idx}.company`}>{t.company}</CmsText>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
