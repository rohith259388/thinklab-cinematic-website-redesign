'use client';

import { useEffect, useRef } from 'react';
import { ArrowDown, ArrowLeft } from 'lucide-react';
import { ensureGsap } from '@/lib/gsap';
import { GalleryBackLink } from '@/components/transition/ProjectTransition';
import { isProjectCover } from '@/components/transition/cardShader';

/**
 * Full-viewport project hero. Its resting state matches the end frame of the card → hero
 * transition so the overlay dissolves invisibly:
 *  - Cover artwork (e.g. Amigo AI): fills the entire viewport background (`project-hero--cover`).
 *  - Brand mark logos: centered inside `.ph-logo` on a white canvas.
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
  const isCover = isProjectCover(image, slug);

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

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top top', end: '+=60%', scrub: 0.6, pin: true },
      });

      if (isCover) {
        tl.to('.ph-logo', { scale: 1.07, opacity: 0.55 }, 0);
      } else {
        tl.to('.ph-logo', { yPercent: -22, scale: 0.72 }, 0);
      }
      tl.to('[data-pt-copy]', { y: -48 }, 0).to('.ph-scroll', { autoAlpha: 0, duration: 0.25 }, 0);
    }, scope);
    return () => ctx.revert();
  }, [isCover]);

  return (
    <div ref={root}>
      <section
        ref={hero}
        className={`project-hero${isCover ? ' project-hero--cover' : ''}`}
        data-project-hero={slug}
        data-project-cover={isCover ? '1' : undefined}
        {...(!isCover ? { 'data-light-surface': '' } : {})}
      >
        <div className="ph-frame">
          <div className="ph-logo" data-cms-entry="image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={alt} decoding="async" loading="eager" />
          </div>
          {isCover && <div className="ph-scrim" aria-hidden="true" />}
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
