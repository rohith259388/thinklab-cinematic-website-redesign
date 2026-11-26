'use client';

import { useRef, type ReactNode, type CSSProperties } from 'react';
import { ensureGsap } from '@/lib/gsap';
import { useIsoLayoutEffect } from '@/lib/useIsoLayoutEffect';

/**
 * Motion language: nothing fades, everything transforms and grows.
 * Elements rise out of darkness like molten material finding shape.
 */

export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 36,
  once = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const { gsap } = ensureGsap();
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          force3D: true,
          duration: 1.1,
          delay,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: once ? 'play none none none' : 'play reverse play reverse' },
        },
      );
    });
    return () => ctx.revert();
  }, [delay, y, once]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

/** Word-by-word theatrical rise for display headlines. */
export function SplitWords({ text, className = '', delay = 0, stagger = 0.055 }: { text: string; className?: string; delay?: number; stagger?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useIsoLayoutEffect(() => {
    const { gsap } = ensureGsap();
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      const words = el.querySelectorAll('[data-word-inner]');
      gsap.fromTo(
        words,
        { yPercent: 118, rotate: 4 },
        {
          yPercent: 0,
          rotate: 0,
          duration: 1.15,
          delay,
          stagger,
          ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
        },
      );
    });
    return () => ctx.revert();
  }, [delay, stagger]);

  return (
    <span ref={ref} className={className} aria-label={text} role="text">
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] pr-[0.15em] -mr-[0.15em] align-bottom" aria-hidden="true">
          <span data-word-inner className="inline-block will-change-transform">
            {w}
            {i < text.split(' ').length - 1 ? ' ' : ''}
          </span>
        </span>
      ))}
    </span>
  );
}

/** Numbers that grow like the organism. */
export function CountUp({
  end,
  prefix = '',
  suffix = '',
  duration = 1.6,
  className = '',
}: {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useIsoLayoutEffect(() => {
    const { gsap } = ensureGsap();
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const state = { v: 0 };
    const ctx = gsap.context(() => {
      gsap.to(state, {
        v: end,
        duration,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' },
        onUpdate: () => {
          el.textContent = `${prefix}${Math.round(state.v)}${suffix}`;
        },
      });
    });
    return () => ctx.revert();
  }, [end, prefix, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{end}{suffix}
    </span>
  );
}

/** The energy divider — draws itself across the section like a filament igniting. */
export function EnergyLine({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const { gsap } = ensureGsap();
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 1.4,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' },
        },
      );
    });
    return () => ctx.revert();
  }, []);

  return <div ref={ref} className={`energy-line ${className}`} />;
}
