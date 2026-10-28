'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motion } from '@/lib/motion';

/**
 * Scene 01 ignition — near darkness, a single spark breathes,
 * then the laboratory lets you in.
 */
export default function Preloader() {
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const orb = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    const state = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.style.overflow = '';
        setGone(true);
      },
    });
    tl.to(state, {
      v: 100,
      duration: 1.55,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (num.current) num.current.textContent = String(Math.round(state.v)).padStart(3, '0');
        if (orb.current) orb.current.style.transform = `scale(${0.86 + (state.v / 100) * 0.3})`;
      },
    })
      .to(label.current, { autoAlpha: 0, y: -14, duration: 0.45, ease: 'power2.in' }, '>-0.05')
      .to(num.current?.parentElement ?? null, { autoAlpha: 0, y: -14, duration: 0.45, ease: 'power2.in' }, '<')
      // The spark is released upward — reverse gravity from the first second.
      .to(orb.current, { y: -window.innerHeight * 0.42, scale: 0.4, autoAlpha: 0, duration: 0.9, ease: 'power3.in' }, '<+0.1')
      .add(() => {
        motion.ready = true;
      }, '<+0.35')
      .to(root.current, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 1.05,
        ease: 'power4.inOut',
      });

    return () => {
      tl.kill();
      document.documentElement.style.overflow = '';
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505]"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
    >
      <div ref={orb} className="spark-core h-16 w-16 md:h-20 md:w-20" style={{ animation: 'none' }} />
      <p ref={label} className="mt-10 font-mono text-[11px] tracking-[0.4em] text-[#9a97a8] uppercase">
        Igniting the first spark
      </p>
      <div className="mt-4 font-mono text-[11px] tracking-[0.3em] text-[#545454]">
        <span ref={num}>000</span>
        <span className="text-[#a280ff]">%</span>
      </div>
    </div>
  );
}
