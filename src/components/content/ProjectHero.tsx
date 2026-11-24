'use client';

import { useEffect, useRef } from 'react';
import { ArrowDown, ArrowLeft } from 'lucide-react';
import { ensureGsap } from '@/lib/gsap';
import { GalleryBackLink } from '@/components/transition/ProjectTransition';

/**
 * Full-viewport project hero. Its resting state is pixel-identical to the end frame of the
 * card → hero transition (white surface, logo in .ph-logo), so the overlay can dissolve
 * invisibly. On scroll it folds back into a floating card while the copy lifts away.
 */
export default function ProjectHero({
  slug,
  title,
  summary,
  category,
  date,
  image,
  alt,
  back,
  label,
}: {
  slug: string;
  title: string;
  summary: string;
  category?: string;
  date?: string;
  image: string;
  alt: string;
  back: string;
  label: string;
}) {
  // React owns `root`; GSAP's pin-spacer is inserted *inside* it around `hero`,
  // so unmounting never asks React to remove a node GSAP has re-parented.
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = hero.current;
    const scope = root.current;
    if (!el || !scope) return;
    const { gsap } = ensureGsap();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      // Direct visits (no card transition) still get a composed entrance.
      if (!document.documentElement.dataset.pt) {
        gsap.fromTo(
          '[data-pt-copy] > *',
          { y: 42, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.35 },
        );
      }

      // The expanded page holds still for a beat: the logo settles back and lifts,
      // the title block rises, then the case study flows up on the same white surface.
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: el, start: 'top top', end: '+=60%', scrub: 0.6, pin: true },
        })
        .to('.ph-logo', { yPercent: -22, scale: 0.72 }, 0)
        .to('[data-pt-copy]', { y: -48 }, 0)
        .to('.ph-scroll', { autoAlpha: 0, duration: 0.25 }, 0);
    }, scope);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
    <section ref={hero} className="project-hero" data-project-hero={slug} data-light-surface>
      <div className="ph-frame">
        <div className="ph-logo" data-cms-entry="image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={alt} decoding="async" loading="eager" />
        </div>
        <div className="ph-copy" data-pt-copy>
          <GalleryBackLink href={back} className="ph-back">
            <ArrowLeft size={15} /> {label}
          </GalleryBackLink>
          <p className="micro-label">
            {category}
            {date && ` / ${date}`}
          </p>
          <h1 data-cms-entry="title">{title}</h1>
          <p data-cms-entry="summary" className="ph-summary">
            {summary}
          </p>
        </div>
        <span className="ph-scroll micro-label">
          Scroll <ArrowDown size={14} />
        </span>
      </div>
    </section>
    </div>
  );
}
