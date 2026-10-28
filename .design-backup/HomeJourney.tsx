'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Star } from 'lucide-react';
import { ensureGsap } from '@/lib/gsap';
import { motion, sampleHomeJourney, type SceneState } from '@/lib/motion';
import { HERO, CTA } from '@/lib/content';

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

    // Hero entrance — delayed until the preloader releases the spark.
    const intro = gsap.timeline({ delay: 2.15 });
    intro
      .fromTo('[data-hero-badge]', { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' })
      .fromTo(
        '[data-hero-line]',
        { yPercent: 112, rotate: 3, autoAlpha: 0 },
        { yPercent: 0, rotate: 0, autoAlpha: 1, duration: 1.25, stagger: 0.12, ease: 'power4.out' },
        '-=0.5',
      )
      .fromTo('[data-hero-ui]', { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.09, ease: 'power3.out' }, '-=0.7');

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

        // Finale caption — the structure has become Thinklab.
        const fIn = Math.min(1, Math.max(0, (p - 0.9) / 0.05));
        fin.style.opacity = fIn.toFixed(3);
        fin.style.transform = `translate3d(0, ${((1 - fIn) * 30).toFixed(2)}px, 0)`;
        fin.style.visibility = fIn <= 0.001 ? 'hidden' : 'visible';

        progEl.style.transform = `scaleX(${p.toFixed(4)})`;
      },
    });

    // Seed the scene immediately (deep links, remounts).
    sampleHomeJourney(st.progress, scratch);
    Object.assign(motion.target, scratch);
    ScrollTrigger.refresh();

    return () => {
      st.kill();
      intro.kill();
    };
  }, []);

  return (
    <section ref={wrap} className="relative h-[640vh]" aria-label="The Living Idea">
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {/* ——— Scene 01 hero copy — centered to frame the glowing centerpiece ——— */}
        <div ref={heroIn} className="relative mx-auto flex h-full w-full max-w-[1500px] flex-col items-center justify-center px-5 text-center md:px-10">
          <div className="flex max-w-4xl flex-col items-center text-center">
            <div data-hero-badge className="chapter-chip inline-flex items-center gap-2.5 rounded-full px-4 py-2 opacity-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e4c390] shadow-[0_0_12px_rgba(228,195,144,0.9)]" />
              <span className="font-mono text-[10.5px] tracking-[0.34em] text-[#e9e3dc] uppercase">{HERO.badge}</span>
            </div>

            <h1 className="mt-6 font-display text-[clamp(2.8rem,7.2vw,6.4rem)] leading-[0.98] tracking-[-0.02em] text-[#fcfcf7]">
              {HERO.titleLines.map((line, i) => (
                <span key={line} className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
                  <span data-hero-line className={`block opacity-0 will-change-transform ${i === 1 ? 'italic text-[#c5b0ff]' : ''}`}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>

            <p data-hero-ui className="mt-4 font-mono text-[10.5px] tracking-[0.34em] text-[#7e6ff0] uppercase opacity-0 md:text-[11px]">
              {HERO.kicker}
            </p>
            <p data-hero-ui className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#b6b4c2] opacity-0 md:text-[17px]">
              {HERO.sub}
            </p>

            <div data-hero-ui className="mt-8 flex flex-wrap items-center justify-center gap-4 opacity-0">
              <Link href="/contact" className="btn-drop sheen px-7 py-3.5 text-sm font-medium">
                {CTA.contact}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/services" className="btn-ghost sheen px-7 py-3.5 text-sm">
                {CTA.services}
              </Link>
              <span className="ml-1 hidden items-center gap-1.5 sm:flex" aria-label={HERO.reviews}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-[#e4c390] text-[#e4c390]" />
                ))}
                <span className="ml-2 font-mono text-[10px] tracking-[0.2em] text-[#9a97a8] uppercase">{HERO.reviews}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ——— Scroll cue ——— */}
        <div ref={cue} className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.42em] text-[#9a97a8] uppercase">Scroll — gravity is optional here</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(197,176,255,0.25)]">
            <ArrowDown className="h-3.5 w-3.5 animate-bounce text-[#c5b0ff]" />
          </span>
        </div>

        {/* ——— Chapter captions ——— */}
        {CHAPTERS.map((c, i) => (
          <div
            key={c.kicker}
            ref={(n) => {
              if (n) chapterRefs.current[i] = n;
            }}
            className="pointer-events-none absolute bottom-[14vh] left-1/2 -translate-x-1/2 max-w-lg px-5 text-center opacity-0"
            style={{ visibility: 'hidden' }}
          >
            <p className="font-mono text-[10.5px] tracking-[0.4em] text-[#a280ff] uppercase">{c.kicker}</p>
            <p className="mt-3 font-display text-2xl italic leading-snug text-[#e9e3dc] md:text-[34px]">{c.line}</p>
          </div>
        ))}

        {/* ——— Finale ——— */}
        <div
          ref={finale}
          className="pointer-events-none absolute inset-x-0 bottom-[16vh] text-center opacity-0"
          style={{ visibility: 'hidden' }}
        >
          <p className="font-mono text-[10.5px] tracking-[0.44em] text-[#a280ff] uppercase">Scroll 04 — The structure becomes</p>
          <p className="glow-violet mt-4 font-display text-5xl tracking-tight text-[#fcfcf7] md:text-7xl">Thinklab</p>
        </div>

        {/* ——— Journey progress filament ——— */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-[rgba(197,176,255,0.08)]">
          <div ref={prog} className="energy-line h-full origin-left scale-x-0" />
        </div>
      </div>
    </section>
  );
}
