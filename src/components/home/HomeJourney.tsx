'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CmsText } from '@/components/cms/Canvas';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { ensureGsap } from '@/lib/gsap';
import { motion, sampleHomeJourney, type SceneState } from '@/lib/motion';

const CHAPTERS = [
  { at: 0.16, out: 0.3, kicker: 'Scroll 01 — Reverse gravity', line: 'The liquid refuses to fall. It rises.' },
  { at: 0.36, out: 0.5, kicker: 'Scroll 02 — The diaspora', line: 'One idea becomes thousands of luminous particles.' },
  { at: 0.54, out: 0.68, kicker: 'Scroll 03 — The blueprint', line: 'Invisible relationships become architecture.' },
  { at: 0.74, out: 0.93, kicker: 'Scroll 04 — The ecosystem', line: 'The structure becomes Thinklab.' },
];

const scratch: SceneState = { ...motion.target };

/**
 * SCENE 01→04 — the pinned cinematic journey of the homepage.
 * The WebGL organism lives behind; this conducts it with scroll.
 */
export default function HomeJourney() {
  const wrap = useRef<HTMLDivElement>(null);
  const heroIn = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const prog = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<HTMLDivElement[]>([]);
  const finale = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { gsap, ScrollTrigger } = ensureGsap();
    const el = wrap.current;
    if (!el) return;

    // Hero entrance — triggered when preloader finishes and opens the home page.
    let intro: gsap.core.Timeline | null = null;
    const playHero = () => {
      if (intro) return;
      intro = gsap.timeline();
      intro
        .fromTo('[data-hero-badge]', { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' })
        .fromTo(
          '[data-hero-line]',
          { yPercent: 112, rotate: 3, autoAlpha: 0 },
          { yPercent: 0, rotate: 0, autoAlpha: 1, duration: 1.25, stagger: 0.12, ease: 'power4.out' },
          '-=0.5',
        )
        .fromTo('[data-hero-ui]', { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.09, ease: 'power3.out' }, '-=0.7');
    };

    const onReady = () => playHero();

    if (motion.ready) {
      playHero();
    } else {
      window.addEventListener('thinklab:ready', onReady, { once: true });
    }

    const captions = chapterRefs.current;
    const hero = heroIn.current!;
    const cueEl = cue.current!;
    const progEl = prog.current!;
    const fin = finale.current!;

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const p = self.progress;
        // Conduct the organism.
        sampleHomeJourney(p, scratch);
        Object.assign(motion.target, scratch);

        // Hero lifts away as the melt begins.
        const heroOut = Math.min(1, p / 0.13);
        hero.style.transform = `translate3d(0, ${(-heroOut * 90).toFixed(2)}px, 0)`;
        hero.style.opacity = String(1 - heroOut);
        hero.style.visibility = heroOut >= 1 ? 'hidden' : 'visible';

        cueEl.style.opacity = String(Math.max(0, 1 - p * 9));

        // Chapter captions crossfade like signal passing through glass.
        captions.forEach((cap, i) => {
          const c = CHAPTERS[i];
          const fade = Math.min(
            Math.max(0, (p - c.at) / 0.045),
            1 - Math.min(1, Math.max(0, (p - c.out) / 0.05)),
          );
          const vis = Math.max(0, Math.min(1, fade));
          cap.style.opacity = vis.toFixed(3);
          cap.style.transform = `translate3d(0, ${((1 - vis) * 26).toFixed(2)}px, 0)`;
          cap.style.visibility = vis <= 0.001 ? 'hidden' : 'visible';
        });

        // Finale caption: smoothly reveals at the final chapter of the journey (matching reference website)
        const a = Math.min(1, Math.max(0, (p - 0.9) / 0.05));
        fin.style.opacity = a.toFixed(3);
        fin.style.transform = `translate3d(0, ${((1 - a) * 30).toFixed(2)}px, 0)`;
        fin.style.visibility = a <= 0.001 ? 'hidden' : 'visible';

        progEl.style.transform = `scaleX(${p.toFixed(4)})`;
      },
    });

    // Seed the scene immediately (deep links, remounts).
    sampleHomeJourney(st.progress, scratch);
    Object.assign(motion.target, scratch);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener('thinklab:ready', onReady);
      st.kill();
      if (intro) intro.kill();
    };
  }, []);

  return (
    <section ref={wrap} className="journey" aria-label="The Living Idea">
      <div className="journey-stage">
        <div ref={heroIn} className="hero-composition">
          <div data-hero-badge className="hero-eyebrow opacity-0">
            <span className="status-dot" />{' '}
            <CmsText field="hero.badge">Helping Brands Grow Faster Online.</CmsText>
          </div>
          <h1 className="hero-title">
            <span className="hero-title-left">
              <span data-hero-line className="block opacity-0">
                <CmsText field="hero.title.left">The Right Partner</CmsText>
              </span>
            </span>
            <span className="hero-title-right">
              <span data-hero-line className="block opacity-0">
                <CmsText field="hero.title.right">For Digital <em>Growth.</em></CmsText>
              </span>
            </span>
          </h1>
          <div data-hero-ui className="hero-description opacity-0">
            <span className="micro-label">
              <CmsText field="hero.kicker">SMALL SPARK. BIG IMPACT.</CmsText>
            </span>
            <p>
              <CmsText field="hero.body">
                We grow your business with SEO, digital marketing, high converting websites, and performance campaigns that bring real leads and sales.
              </CmsText>
            </p>
            <Link href="/contact" className="text-link">
              <CmsText field="hero.cta">Contact Us</CmsText> <ArrowUpRight size={17} />
            </Link>
          </div>
          <div data-hero-ui className="hero-coordinate opacity-0">
            <span>
              <CmsText field="hero.reviews">★ 200+ 5 STAR REVIEWS</CmsText>
            </span>
            <span>
              <CmsText field="hero.locations">INDIA ↔ AUSTRALIA</CmsText>
            </span>
          </div>
        </div>

        <div ref={cue} className="journey-bottom">
          <a href="#studio" className="journey-skip">
            <CmsText field="hero.skip">Discover Thinklab</CmsText> <ArrowUpRight size={14} />
          </a>
          <span className="scroll-prompt">
            <span className="scroll-track">
              <ArrowDown size={14} />
            </span>{' '}
            SCROLL TO IGNITE
          </span>
          <span className="journey-edition">THE LIVING IDEA — 01 / 04</span>
        </div>

        {CHAPTERS.map((c, i) => (
          <div
            key={c.kicker}
            ref={(n) => {
              if (n) chapterRefs.current[i] = n;
            }}
            className="journey-caption"
            style={{ visibility: 'hidden', opacity: 0 }}
          >
            <span className="micro-label">
              <CmsText field={`hero.chapter.${i}.kicker`}>{c.kicker}</CmsText>
            </span>
            <p>
              <CmsText field={`hero.chapter.${i}.line`}>{c.line}</CmsText>
            </p>
          </div>
        ))}
        <div ref={finale} className="journey-finale" style={{ visibility: 'hidden', opacity: 0 }}>
          <span className="micro-label">
            <CmsText field="hero.finale.kicker">ONE IDEA. INFINITE POSSIBILITIES.</CmsText>
          </span>
          <p>
            <CmsText field="hero.finale.title">This is Thinklab</CmsText>
            <span className="journey-finale-badge">®</span>
          </p>
        </div>
        <div className="journey-progress">
          <div ref={prog} className="energy-line h-full origin-left scale-x-0" />
        </div>
      </div>
    </section>
  );
}
