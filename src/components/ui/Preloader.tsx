'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motion } from '@/lib/motion';

function makeTear(steps = 28) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * 100;
    // Organic jagged jitter across the center line
    const jitter = Math.sin(i * 1.5) * 1.8 + (Math.random() - 0.5) * 4.2;
    pts.push([50 + jitter, y]);
  }
  const left = ['0% 0%', ...pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`), '0% 100%'];
  const right = ['100% 0%', ...pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`), '100% 100%'];
  return {
    left: `polygon(${left.join(',')})`,
    right: `polygon(${right.join(',')})`,
    pts,
  };
}

export default function Preloader() {
  const [gone, setGone] = useState(false);
  const [tearPolys, setTearPolys] = useState<{ left: string; right: string; pts: [number, number][] } | null>(null);

  const loaderRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const brandTextRef = useRef<HTMLDivElement>(null);

  const paperLeftRef = useRef<HTMLDivElement>(null);
  const paperRightRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Generate organic tear path
    const polys = makeTear(28);
    setTearPolys(polys);

    // Lock page scroll
    document.documentElement.style.overflow = 'hidden';

    // Reduced motion check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cards = cardsRef.current.filter(Boolean);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isMobile = w < 768;

    const rx = Math.min(w * (isMobile ? 0.36 : 0.32), isMobile ? 180 : 420);
    const ry = Math.min(h * (isMobile ? 0.32 : 0.28), isMobile ? 220 : 260);

    // Position setup: calculate each card's target orbit position
    cards.forEach((el, i) => {
      const a = (i / cards.length) * Math.PI * 2 - Math.PI / 2;
      const depth = parseFloat(el.dataset.depth || '1.0');
      (el as unknown as { _targetX: number; _targetY: number; _depth: number })._targetX = Math.cos(a) * rx;
      (el as unknown as { _targetY: number; _depth: number })._targetY = Math.sin(a) * ry;
      (el as unknown as { _depth: number })._depth = depth;

      // Ensure cards are 100% hidden at origin
      gsap.set(el, {
        x: 0,
        y: 0,
        scale: 0,
        opacity: 0,
        visibility: 'hidden',
        filter: isMobile ? 'none' : `blur(${(1 - depth) * 3}px)`,
      });
    });

    // Logo initial state: tiny dot at 0%
    if (logoWrapRef.current) {
      gsap.set(logoWrapRef.current, {
        scale: 0.04,
        opacity: 1,
        transformOrigin: '50% 50%',
      });
    }

    if (brandTextRef.current) {
      gsap.set(brandTextRef.current, {
        opacity: 0,
        y: 10,
      });
    }

    const finish = () => {
      document.documentElement.style.overflow = '';
      motion.ready = true;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('thinklab:ready'));
      }
      setGone(true);
    };

    if (prefersReducedMotion) {
      const rmTl = gsap.timeline({ onComplete: finish });
      rmTl
        .fromTo(logoWrapRef.current, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 })
        .to(loaderRef.current, { opacity: 0, duration: 0.5, delay: 0.8 });
      return;
    }

    // Master Timeline
    const tl = gsap.timeline({
      delay: 0.1,
      onComplete: finish,
    });

    // State for percentage counter
    const counterState = { val: 0 };

    // --- PHASE 1: 0% -> 100% FAVICON GROWS FROM A SMALL DOT TO ORIGINAL SIZE ---
    // Counter runs 0 -> 100 over 2.4 seconds
    tl.to(
      counterState,
      {
        val: 100,
        duration: 2.4,
        ease: 'power2.inOut',
        onUpdate() {
          if (counterRef.current) {
            counterRef.current.textContent = `${Math.round(counterState.val)}%`;
          }
        },
      },
      0,
    );

    // Favicon smoothly scales up from small dot (0.04) to original full size (1.0)
    if (logoWrapRef.current) {
      tl.to(
        logoWrapRef.current,
        {
          scale: 1,
          duration: 2.4,
          ease: 'power2.out',
        },
        0,
      );
    }

    // Brand text fades in near the end of the counter (from 1.6s to 2.3s)
    if (brandTextRef.current) {
      tl.to(
        brandTextRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
        },
        1.6,
      );
    }

    // Celebratory pulse when reaching 100%
    if (logoWrapRef.current) {
      tl.to(
        logoWrapRef.current,
        {
          scale: 1.08,
          duration: 0.22,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
        },
        2.4,
      );
    }

    // --- PHASE 2: AFTER 100%, THE 7 SERVICE ICONS POP OUT ---
    // Make cards visible right before popping
    tl.set(cards, { visibility: 'visible' }, '+=0.1');

    // Cards pop out from center (0,0) to their loose orbit positions
    tl.to(
      cards,
      {
        x: (i) => (cards[i] as unknown as { _targetX: number })._targetX,
        y: (i) => (cards[i] as unknown as { _targetY: number })._targetY,
        scale: (i) => (cards[i] as unknown as { _depth: number })._depth,
        opacity: 1,
        duration: 0.75,
        ease: 'back.out(2)',
        stagger: 0.12,
      },
      '<',
    );

    // Stroke-draw paths inside the cards
    tl.fromTo(
      '.card .wave, .card .code, .card .line, .card .arrow, .card .curve',
      { strokeDasharray: 60, strokeDashoffset: 60 },
      { strokeDashoffset: 0, duration: 0.7, stagger: 0.03, ease: 'power2.out' },
      '<0.1',
    );

    // Heart and star bounce pop
    tl.fromTo(
      '.card .heart, .card .star',
      { scale: 0, transformOrigin: '50% 50%' },
      { scale: 1, duration: 0.45, ease: 'back.out(3)', stagger: 0.14 },
      '<0.2',
    );

    // Subtle idle floating drift
    let idleTweens: gsap.core.Tween[] = [];
    tl.add(() => {
      idleTweens = cards.map((el, i) =>
        gsap.to(el, {
          y: `+=${8 + (i % 3) * 3}`,
          x: `+=${5 - (i % 2) * 10}`,
          duration: 2.0 + (i % 3) * 0.4,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        }),
      );
    });

    // Cards stay in orbit for ~0.8s
    tl.to({}, { duration: 0.8 });

    // --- PHASE 3: GATHER BACK INTO THE LOGO ---
    tl.to(
      cards,
      {
        x: 0,
        y: 0,
        scale: 0.15,
        opacity: 0,
        duration: 0.48,
        ease: 'power3.in',
        stagger: 0.02,
        onStart: () => {
          idleTweens.forEach((t) => t.kill());
        },
      },
      '+=0.1',
    );

    // Logo pulse on absorption
    if (logoWrapRef.current) {
      tl.to(
        logoWrapRef.current,
        {
          scale: 1.15,
          duration: 0.22,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
        },
        '<0.2',
      );
    }

    // --- PHASE 4: OBSIDIAN PAPER TEARS DOWN THE CENTER WITH GLOWING GRADIENT EDGES ---
    // Fade stage out slightly right before tearing
    tl.to(stageRef.current, { opacity: 0, scale: 0.96, duration: 0.25 }, '+=0.1');

    // Left obsidian paper half tears and slides away
    tl.to(
      paperLeftRef.current,
      {
        xPercent: -72,
        rotation: -4,
        duration: 0.95,
        ease: 'power3.inOut',
      },
      '<',
    );

    // Right obsidian paper half tears and slides away
    tl.to(
      paperRightRef.current,
      {
        xPercent: 72,
        rotation: 4,
        duration: 0.95,
        ease: 'power3.inOut',
      },
      '<',
    );

    // App reveal underneath
    const mainEl = document.getElementById('main');
    if (mainEl) {
      tl.fromTo(
        mainEl,
        { scale: 1.04, opacity: 0.8 },
        { scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out' },
        '<0.1',
      );
    }

    return () => {
      tl.kill();
      idleTweens.forEach((t) => t.kill());
      document.documentElement.style.overflow = '';
    };
  }, []);

  if (gone) return null;

  return (
    <div
      id="loader"
      ref={loaderRef}
      className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none select-none bg-transparent"
      aria-hidden="true"
    >
      {/* SVG Definitions: Gradient & Dark Paper Texture */}
      <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
        <defs>
          {/* Signature Favicon Gradient */}
          <linearGradient id="tlds-grad" gradientUnits="userSpaceOnUse" x1="0" y1="64" x2="64" y2="0">
            <stop offset="0" stopColor="#ff9a3c" />
            <stop offset="0.5" stopColor="#ff4fa3" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>

          {/* Full Vertical Tear Seam Gradient */}
          <linearGradient id="tlds-tear-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff9a3c" />
            <stop offset="45%" stopColor="#ff4fa3" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          {/* Procedural Tactile Dark Paper Fiber Filter */}
          <filter id="obsidian-paper-texture" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="#ffffff" surfaceScale="1.4" result="light">
              <feDistantLight azimuth="45" elevation="60" />
            </feDiffuseLighting>
            <feComponentTransfer in="light" result="dimLight">
              <feFuncR type="linear" slope="0.35" intercept="0.08" />
              <feFuncG type="linear" slope="0.35" intercept="0.08" />
              <feFuncB type="linear" slope="0.45" intercept="0.12" />
            </feComponentTransfer>
            <feBlend mode="overlay" in="SourceGraphic" in2="dimLight" />
          </filter>
        </defs>
      </svg>

      {/* ============================================================ */}
      {/* TORN OBSIDIAN PAPER LAYER - LEFT HALF */}
      {/* ============================================================ */}
      <div
        ref={paperLeftRef}
        className="paper paper-left absolute inset-0 w-full h-full will-change-transform"
        style={{
          clipPath: tearPolys ? tearPolys.left : 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)',
          filter: 'drop-shadow(14px 0px 32px rgba(0,0,0,0.75))',
        }}
      >
        <div className="paper-inner absolute inset-0 bg-[#08080d]">
          {/* Dark paper texture overlay with creases */}
          <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none">
            <rect width="100%" height="100%" fill="#0a0a12" filter="url(#obsidian-paper-texture)" />
            {/* Subtle paper fold shadows and highlights */}
            <path d="M 0 140 Q 240 100 500 260 T 1000 420" stroke="#000" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
            <path d="M 100 0 Q 320 300 580 540 T 920 880" stroke="#fff" strokeWidth="1" strokeOpacity="0.04" fill="none" />
            <path d="M 50 620 Q 300 560 620 800" stroke="#000" strokeWidth="1.8" strokeOpacity="0.35" fill="none" />
            <path d="M 260 220 L 440 390 L 330 580" stroke="#fff" strokeWidth="0.8" strokeOpacity="0.05" fill="none" />
          </svg>

          {/* Glowing brand gradient core fiber along the torn seam */}
          <div
            className="absolute inset-y-0 right-0 w-[5px] pointer-events-none opacity-90 blur-[1px]"
            style={{
              background: 'linear-gradient(to bottom, #ff9a3c, #ff4fa3, #8b5cf6)',
              boxShadow: '0 0 18px rgba(255, 79, 163, 0.6), 0 0 30px rgba(139, 92, 246, 0.45)',
            }}
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* TORN OBSIDIAN PAPER LAYER - RIGHT HALF */}
      {/* ============================================================ */}
      <div
        ref={paperRightRef}
        className="paper paper-right absolute inset-0 w-full h-full will-change-transform"
        style={{
          clipPath: tearPolys ? tearPolys.right : 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)',
          filter: 'drop-shadow(-14px 0px 32px rgba(0,0,0,0.75))',
        }}
      >
        <div className="paper-inner absolute inset-0 bg-[#08080d]">
          {/* Dark paper texture overlay with creases */}
          <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none">
            <rect width="100%" height="100%" fill="#0a0a12" filter="url(#obsidian-paper-texture)" />
            {/* Subtle paper fold shadows and highlights */}
            <path d="M 820 80 Q 620 240 320 400 T 0 680" stroke="#000" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
            <path d="M 680 0 Q 540 290 270 540 T 60 900" stroke="#fff" strokeWidth="1" strokeOpacity="0.04" fill="none" />
            <path d="M 870 500 Q 570 480 220 720" stroke="#000" strokeWidth="1.8" strokeOpacity="0.35" fill="none" />
            <path d="M 520 180 L 340 360 L 470 540" stroke="#fff" strokeWidth="0.8" strokeOpacity="0.05" fill="none" />
          </svg>

          {/* Glowing brand gradient core fiber along the torn seam */}
          <div
            className="absolute inset-y-0 left-0 w-[5px] pointer-events-none opacity-90 blur-[1px]"
            style={{
              background: 'linear-gradient(to bottom, #ff9a3c, #ff4fa3, #8b5cf6)',
              boxShadow: '0 0 18px rgba(255, 79, 163, 0.6), 0 0 30px rgba(139, 92, 246, 0.45)',
            }}
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* STAGE: CENTER LOGO, % COUNTER & ORBITING ICONS */}
      {/* ============================================================ */}
      <div
        ref={stageRef}
        className="stage absolute inset-0 grid place-items-center pointer-events-none will-change-transform z-10"
      >
        {/* CENTER FAVICON (Scales smoothly from small dot at 0% to original size at 100%) */}
        <div
          ref={logoWrapRef}
          className="logo relative flex flex-col items-center justify-center will-change-transform"
          style={{ transform: 'scale(0.04)' }}
        >
          {/* Luminous brand gradient bloom behind logo */}
          <div
            className="absolute -inset-12 rounded-full blur-3xl opacity-60 pointer-events-none animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(255, 79, 163, 0.35) 0%, rgba(139, 92, 246, 0.28) 45%, transparent 75%)',
            }}
          />

          {/* High-Resolution Favicon Icon */}
          <div className="relative w-[120px] h-[120px] md:w-[132px] md:h-[132px] rounded-3xl p-1 bg-gradient-to-tr from-white/10 to-white/5 border border-white/20 shadow-[0_16px_50px_rgba(139,92,246,0.35)] backdrop-blur-md overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/tlds-favicon.png"
              alt="Thinklab Digital Solutions"
              className="w-full h-full object-cover rounded-[22px]"
            />
          </div>

          {/* Company Name on Obsidian Paper */}
          <div
            ref={brandTextRef}
            className="brand-text mt-4 flex flex-col items-center"
            style={{ opacity: 0 }}
          >
            <span className="text-white/95 text-sm md:text-base font-bold tracking-[0.24em] uppercase">
              Thinklab
            </span>
            <span className="text-white/50 text-[10px] md:text-xs tracking-[0.28em] uppercase font-mono mt-0.5">
              Digital Solutions
            </span>
          </div>
        </div>

        {/* 7 SERVICE ICONS (Pop out into orbit AFTER 100% - Initially hidden via inline styles) */}
        <div className="orbit absolute inset-0 grid place-items-center pointer-events-none">
          {/* 01 Digital Marketing (megaphone + sound waves + heart) */}
          <div
            ref={(el) => { if (el) cardsRef.current[0] = el; }}
            data-depth="1.0"
            style={{ opacity: 0, transform: 'scale(0)', visibility: 'hidden' }}
            className="card c1 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/[0.06] border border-white/[0.16] backdrop-blur-[10px] shadow-[0_12px_36px_rgba(139,92,246,0.25)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-white/50 tracking-wider">
              01
            </span>
            <svg
              className="svc svc-01 w-[48px] h-[48px] md:w-[52px] md:h-[52px]"
              viewBox="0 0 64 64"
              fill="none"
              stroke="url(#tlds-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 26 L40 14 V50 L14 38 Z" />
              <path d="M14 26 H10 a3 3 0 0 0 -3 3 v6 a3 3 0 0 0 3 3 H14" />
              <path d="M20 40 l3 12 h6 l-2.5 -10" />
              <path className="wave" d="M46 27 Q50 32 46 37" />
              <path className="wave" d="M51 23 Q58 32 51 41" />
              <path
                className="heart"
                d="M52 19 l-4 -4 a2.5 2.5 0 0 1 4 -3 a2.5 2.5 0 0 1 4 3 z"
                fill="url(#tlds-grad)"
                stroke="none"
              />
            </svg>
          </div>

          {/* 02 Website Development (browser window + </>) */}
          <div
            ref={(el) => { if (el) cardsRef.current[1] = el; }}
            data-depth="0.75"
            style={{ opacity: 0, transform: 'scale(0)', visibility: 'hidden' }}
            className="card c2 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/[0.06] border border-white/[0.16] backdrop-blur-[10px] shadow-[0_12px_36px_rgba(139,92,246,0.25)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-white/50 tracking-wider">
              02
            </span>
            <svg
              className="svc svc-02 w-[48px] h-[48px] md:w-[52px] md:h-[52px]"
              viewBox="0 0 64 64"
              fill="none"
              stroke="url(#tlds-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="6" y="12" width="52" height="40" rx="6" />
              <path d="M6 23 H58" />
              <circle cx="13" cy="17.5" r="1.3" fill="url(#tlds-grad)" stroke="none" />
              <circle cx="18" cy="17.5" r="1.3" fill="url(#tlds-grad)" stroke="none" />
              <circle cx="23" cy="17.5" r="1.3" fill="url(#tlds-grad)" stroke="none" />
              <path className="code" d="M26 32 l-6 6 6 6" />
              <path className="code" d="M38 32 l6 6 -6 6" />
              <path className="code" d="M34.5 30 l-5 16" />
            </svg>
          </div>

          {/* 03 Brand Strategy (bezier curve with pen-tool handles) */}
          <div
            ref={(el) => { if (el) cardsRef.current[2] = el; }}
            data-depth="0.9"
            style={{ opacity: 0, transform: 'scale(0)', visibility: 'hidden' }}
            className="card c3 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/[0.06] border border-white/[0.16] backdrop-blur-[10px] shadow-[0_12px_36px_rgba(139,92,246,0.25)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-white/50 tracking-wider">
              03
            </span>
            <svg
              className="svc svc-03 w-[48px] h-[48px] md:w-[52px] md:h-[52px]"
              viewBox="0 0 64 64"
              fill="none"
              stroke="url(#tlds-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path className="curve" d="M10 50 C20 6, 44 6, 54 50" />
              <path d="M10 50 L20 6 M54 50 L44 6" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="20" cy="6" r="3" fill="url(#tlds-grad)" stroke="none" />
              <circle cx="44" cy="6" r="3" fill="url(#tlds-grad)" stroke="none" />
              <rect x="6" y="46" width="8" height="8" rx="1.5" fill="#08080d" />
              <rect x="50" y="46" width="8" height="8" rx="1.5" fill="#08080d" />
            </svg>
          </div>

          {/* 04 Workflow / AI Automation (nodes + travelling pulse) */}
          <div
            ref={(el) => { if (el) cardsRef.current[3] = el; }}
            data-depth="0.7"
            style={{ opacity: 0, transform: 'scale(0)', visibility: 'hidden' }}
            className="card c4 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/[0.06] border border-white/[0.16] backdrop-blur-[10px] shadow-[0_12px_36px_rgba(139,92,246,0.25)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-white/50 tracking-wider">
              04
            </span>
            <svg
              className="svc svc-04 w-[48px] h-[48px] md:w-[52px] md:h-[52px]"
              viewBox="0 0 64 64"
              fill="none"
              stroke="url(#tlds-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 30 L31 17 M17 34 L31 47 M41 17 L49 29 M41 47 L49 35" />
              <circle cx="12" cy="32" r="6" />
              <circle cx="36" cy="14" r="6" />
              <circle cx="36" cy="50" r="6" />
              <circle cx="54" cy="32" r="6" />
              <circle r="2.8" fill="url(#tlds-grad)" stroke="none">
                <animateMotion dur="2.4s" repeatCount="indefinite" path="M12 32 L36 14 L54 32 L36 50 Z" />
              </circle>
            </svg>
          </div>

          {/* 05 CRM Services (contact card) */}
          <div
            ref={(el) => { if (el) cardsRef.current[4] = el; }}
            data-depth="0.95"
            style={{ opacity: 0, transform: 'scale(0)', visibility: 'hidden' }}
            className="card c5 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/[0.06] border border-white/[0.16] backdrop-blur-[10px] shadow-[0_12px_36px_rgba(139,92,246,0.25)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-white/50 tracking-wider">
              05
            </span>
            <svg
              className="svc svc-05 w-[48px] h-[48px] md:w-[52px] md:h-[52px]"
              viewBox="0 0 64 64"
              fill="none"
              stroke="url(#tlds-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="6" y="14" width="52" height="36" rx="6" />
              <circle cx="22" cy="28" r="5" />
              <path d="M12 43 Q22 31 32 43" />
              <path className="line" d="M39 26 H50" />
              <path className="line" d="M39 33 H50" />
              <path className="line" d="M39 40 H46" />
            </svg>
          </div>

          {/* 06 Strategic Planning (target + arrow) */}
          <div
            ref={(el) => { if (el) cardsRef.current[5] = el; }}
            data-depth="0.8"
            style={{ opacity: 0, transform: 'scale(0)', visibility: 'hidden' }}
            className="card c6 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/[0.06] border border-white/[0.16] backdrop-blur-[10px] shadow-[0_12px_36px_rgba(139,92,246,0.25)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-white/50 tracking-wider">
              06
            </span>
            <svg
              className="svc svc-06 w-[48px] h-[48px] md:w-[52px] md:h-[52px]"
              viewBox="0 0 64 64"
              fill="none"
              stroke="url(#tlds-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="30" cy="34" r="21" />
              <circle cx="30" cy="34" r="13" />
              <circle cx="30" cy="34" r="5" fill="url(#tlds-grad)" stroke="none" />
              <path className="arrow" d="M32 32 L55 9" />
              <path className="arrow" d="M47 9 H55 V17" />
              <path className="arrow" d="M55 9 L59 5" />
            </svg>
          </div>

          {/* 07 PR & Events (ticket with star) */}
          <div
            ref={(el) => { if (el) cardsRef.current[6] = el; }}
            data-depth="1.0"
            style={{ opacity: 0, transform: 'scale(0)', visibility: 'hidden' }}
            className="card c7 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/[0.06] border border-white/[0.16] backdrop-blur-[10px] shadow-[0_12px_36px_rgba(139,92,246,0.25)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-white/50 tracking-wider">
              07
            </span>
            <svg
              className="svc svc-07 w-[48px] h-[48px] md:w-[52px] md:h-[52px]"
              viewBox="0 0 64 64"
              fill="none"
              stroke="url(#tlds-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 20 H56 V28 a4 4 0 0 0 0 8 V44 H8 V36 a4 4 0 0 0 0 -8 Z" />
              <path d="M20 21 V43" strokeWidth="1.5" strokeDasharray="2 3" />
              <path
                className="star"
                d="M38 26 l2.3 4.7 5.2 .8 -3.8 3.6 .9 5.2 -4.6 -2.5 -4.6 2.5 .9 -5.2 -3.8 -3.6 5.2 -.8 z"
                fill="url(#tlds-grad)"
                stroke="none"
              />
            </svg>
          </div>
        </div>

        {/* Percentage Counter at bottom (Clean monospace badge) */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center">
          <div
            ref={counterRef}
            className="counter font-mono text-sm tracking-widest text-white/70 bg-white/[0.04] border border-white/10 px-4 py-1.5 rounded-full shadow-inner backdrop-blur-sm"
          >
            0%
          </div>
        </div>
      </div>
    </div>
  );
}
