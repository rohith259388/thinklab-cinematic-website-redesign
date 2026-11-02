'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motion } from '@/lib/motion';

export default function Preloader() {
  const [gone, setGone] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const brandTextRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Lock page scroll during preloader
    document.documentElement.style.overflow = 'hidden';

    // Reduced motion check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cards = cardsRef.current.filter(Boolean);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isMobile = w < 768;

    const rx = Math.min(w * (isMobile ? 0.44 : 0.38), isMobile ? 210 : 480);
    const ry = Math.min(h * (isMobile ? 0.32 : 0.28), isMobile ? 220 : 270);

    // Maximum radius needed for circular portal to fully clear viewport corners
    const maxPortalRadius = (Math.hypot(w, h) / 2) * 1.35;

    // Position setup: calculate each card's target orbit position
    cards.forEach((el, i) => {
      const a = (i / cards.length) * Math.PI * 2 - Math.PI / 2;
      const depth = parseFloat(el.dataset.depth || '1.0');
      (el as unknown as { _targetX: number; _targetY: number; _depth: number })._targetX = Math.cos(a) * rx;
      (el as unknown as { _targetY: number; _depth: number })._targetY = Math.sin(a) * ry;
      (el as unknown as { _depth: number })._depth = depth;

      // Start hidden at origin (behind text)
      gsap.set(el, {
        x: 0,
        y: 0,
        scale: 0,
        opacity: 0,
        visibility: 'hidden',
        filter: isMobile ? 'none' : `blur(${(1 - depth) * 3}px)`,
      });
    });

    // Typography initial state
    if (logoWrapRef.current) {
      gsap.set(logoWrapRef.current, {
        scale: 1,
        opacity: 1,
        transformOrigin: '50% 50%',
      });
    }

    gsap.set('[data-char]', {
      yPercent: 115,
      rotate: 3,
      opacity: 0,
    });

    if (brandTextRef.current) {
      gsap.set(brandTextRef.current, {
        opacity: 0,
        y: 8,
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
        .fromTo(logoWrapRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 })
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

    // --- PHASE 1: 0% -> 100% PERCENTAGE COUNTER & THINKLAB TYPOGRAPHY ANIMATION ---
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

    // The letters of "thinklab" rise up in elegant typography animation
    tl.to(
      '[data-char]',
      {
        yPercent: 0,
        rotate: 0,
        opacity: 1,
        duration: 1.1,
        stagger: 0.08,
        ease: 'power4.out',
      },
      0.2,
    );

    // Subtitle "Digital Solutions" fades in cleanly under thinklab
    if (brandTextRef.current) {
      tl.to(
        brandTextRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
        },
        1.3,
      );
    }

    // Celebratory subtle breathe / pulse when reaching 100%
    if (logoWrapRef.current) {
      tl.to(
        logoWrapRef.current,
        {
          scale: 1.05,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
        },
        2.4,
      );
    }

    // --- PHASE 2: AFTER 100%, THE 7 SERVICE ICONS POP OUT ---
    tl.set(cards, { visibility: 'visible' }, '+=0.1');

    // Cards burst outward from behind the logo into loose orbit
    tl.to(
      cards,
      {
        x: (i) => (cards[i] as unknown as { _targetX: number })._targetX,
        y: (i) => (cards[i] as unknown as { _targetY: number })._targetY,
        scale: (i) => (cards[i] as unknown as { _depth: number })._depth,
        opacity: 1,
        duration: 0.65,
        ease: 'back.out(1.8)',
        stagger: 0.06,
      },
      '<',
    );

    // Stroke-draw paths inside the cards
    tl.fromTo(
      '.card .wave, .card .code, .card .line, .card .arrow, .card .curve',
      { strokeDasharray: 60, strokeDashoffset: 60 },
      { strokeDashoffset: 0, duration: 0.55, stagger: 0.02, ease: 'power2.out' },
      '<0.08',
    );

    // Heart and star bounce pop
    tl.fromTo(
      '.card .heart, .card .star',
      { scale: 0, transformOrigin: '50% 50%' },
      { scale: 1, duration: 0.4, ease: 'back.out(3)', stagger: 0.08 },
      '<0.12',
    );

    // --- PHASE 3: GATHER BACK BEHIND THE TEXT ---
    // Brief orbit hold (0.35s), then cards accelerate directly into the core
    tl.to(
      cards,
      {
        x: 0,
        y: 0,
        scale: 0.1,
        opacity: 0,
        duration: 0.38,
        ease: 'power2.in',
        stagger: 0.015,
      },
      '+=0.35',
    );

    // --- PHASE 4: SIMULTANEOUS CIRCULAR BUBBLE EXPANSION ---
    const portalState = { radius: 0 };

    // At the exact moment of convergence, the circular portal EXPLODES outward with instant momentum!
    // No stall, no delay — inward collapse directly triggers the outward blast.
    tl.to(
      portalState,
      {
        radius: maxPortalRadius,
        duration: 1.5, // Cinematic yet responsive explosion
        ease: 'power3.out', // Immediate high burst velocity clearing the core within 100ms
        onStart: () => {
          // Trigger the HomePage entrance animations as the portal opens
          motion.ready = true;
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('thinklab:ready'));
          }
        },
        onUpdate() {
          const r = portalState.radius;
          if (paperRef.current) {
            // Cut expanding circular hole through the paper to reveal the HomePage beneath
            const mask = `radial-gradient(circle at 50% 50%, transparent ${r}px, black ${r + 2.5}px)`;
            paperRef.current.style.maskImage = mask;
            paperRef.current.style.webkitMaskImage = mask;
          }
        },
      },
      '>-0.08', // Explodes right as the cards collide into the center
    );

    // Thinklab typography dissolves at the exact moment the explosion starts
    if (logoWrapRef.current) {
      tl.to(
        logoWrapRef.current,
        {
          opacity: 0,
          scale: 1.08,
          duration: 0.35,
          ease: 'power2.out',
        },
        '<',
      );
    }

    // Counter fades out immediately
    if (counterRef.current) {
      tl.to(counterRef.current, { opacity: 0, duration: 0.25, ease: 'power2.out' }, '<');
    }

    return () => {
      tl.kill();
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
      {/* Shared Gradient & Paper Texture Lighting */}
      <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id="tlds-grad" gradientUnits="userSpaceOnUse" x1="0" y1="64" x2="64" y2="0">
            <stop offset="0" stopColor="#ff9a3c" />
            <stop offset="0.5" stopColor="#ff4fa3" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>

          {/* Paper Texture Filter */}
          <filter id="paper-texture" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="5" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="#ffffff" surfaceScale="2.8" result="light">
              <feDistantLight azimuth="55" elevation="52" />
            </feDiffuseLighting>
            <feComponentTransfer in="light" result="brightLight">
              <feFuncR type="linear" slope="0.94" intercept="0.06" />
              <feFuncG type="linear" slope="0.94" intercept="0.06" />
              <feFuncB type="linear" slope="0.94" intercept="0.06" />
            </feComponentTransfer>
            <feBlend mode="multiply" in="SourceGraphic" in2="brightLight" />
          </filter>
        </defs>
      </svg>

      {/* ============================================================ */}
      {/* THE PAPER LAYER (Punched through by the expanding circular portal) */}
      {/* ============================================================ */}
      <div
        ref={paperRef}
        className="paper-layer absolute inset-0 w-full h-full will-change-transform z-10"
        style={{
          backgroundColor: '#fafafc',
        }}
      >
        <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none">
          <rect width="100%" height="100%" fill="#fafafc" filter="url(#paper-texture)" />
          {/* Subtle natural paper creases */}
          <path d="M 0 120 Q 250 80 500 240 T 1000 400" stroke="#000" strokeWidth="1" strokeOpacity="0.06" fill="none" />
          <path d="M 120 0 Q 340 320 600 550 T 950 900" stroke="#000" strokeWidth="1.2" strokeOpacity="0.05" fill="none" />
          <path d="M 40 600 Q 320 540 650 780" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
          <path d="M 800 60 Q 600 220 300 380 T 0 650" stroke="#000" strokeWidth="1.2" strokeOpacity="0.06" fill="none" />
          <path d="M 650 0 Q 520 280 250 520 T 50 880" stroke="#000" strokeWidth="1" strokeOpacity="0.05" fill="none" />
        </svg>
      </div>

      {/* ============================================================ */}
      {/* STAGE: CENTER THINKLAB TYPOGRAPHY, 7 ORBITING CARDS & COUNTER */}
      {/* ============================================================ */}
      <div
        ref={stageRef}
        className="stage absolute inset-0 grid place-items-center pointer-events-none will-change-transform z-30"
      >
        {/* CENTER TYPOGRAPHY ANIMATION: thinklab (without indicator symbol) */}
        <div
          ref={logoWrapRef}
          className="relative z-40 flex flex-col items-center justify-center will-change-transform px-4 pointer-events-none select-none"
        >
          {/* Soft ambient atmospheric glow */}
          <div
            className="absolute -inset-16 rounded-full blur-3xl opacity-40 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.24) 0%, rgba(255, 79, 163, 0.16) 45%, transparent 75%)',
            }}
          />

          {/* HomePage Thinklab Typography (No indicator symbol) */}
          <div className="wordmark flex items-center justify-center font-semibold tracking-[-0.045em] text-[#14141e] text-5xl sm:text-6xl md:text-7xl lg:text-8xl select-none leading-none">
            {'thinklab'.split('').map((ch, i) => (
              <span key={i} className="inline-block overflow-hidden py-2 px-[1px]">
                <span
                  data-char
                  className="char-inner inline-block will-change-transform"
                >
                  {ch}
                </span>
              </span>
            ))}
          </div>

          {/* Subtitle */}
          <div
            ref={brandTextRef}
            className="brand-text mt-3 flex flex-col items-center"
            style={{ opacity: 0 }}
          >
            <span className="text-[#646473] text-[10px] sm:text-xs md:text-sm tracking-[0.32em] uppercase font-mono">
              Digital Solutions
            </span>
          </div>
        </div>

        {/* 7 SERVICE ICONS (Z-index 30: Pop out into orbit, then tuck BEHIND text) */}
        <div className="orbit absolute inset-0 grid place-items-center pointer-events-none z-30">
          {/* 01 Digital Marketing (megaphone + sound waves + heart) */}
          <div
            ref={(el) => { if (el) cardsRef.current[0] = el; }}
            data-depth="1.0"
            style={{ opacity: 0, transform: 'scale(0)', visibility: 'hidden' }}
            className="card c1 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/90 border border-[#8b5cf6]/30 backdrop-blur-md shadow-[0_12px_32px_rgba(139,92,246,0.2)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-[#181824]/60 tracking-wider">
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
            className="card c2 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/90 border border-[#8b5cf6]/30 backdrop-blur-md shadow-[0_12px_32px_rgba(139,92,246,0.2)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-[#181824]/60 tracking-wider">
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
            className="card c3 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/90 border border-[#8b5cf6]/30 backdrop-blur-md shadow-[0_12px_32px_rgba(139,92,246,0.2)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-[#181824]/60 tracking-wider">
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
              <rect x="6" y="46" width="8" height="8" rx="1.5" fill="#f8f8fb" />
              <rect x="50" y="46" width="8" height="8" rx="1.5" fill="#f8f8fb" />
            </svg>
          </div>

          {/* 04 Workflow / AI Automation (nodes + travelling pulse) */}
          <div
            ref={(el) => { if (el) cardsRef.current[3] = el; }}
            data-depth="0.7"
            style={{ opacity: 0, transform: 'scale(0)', visibility: 'hidden' }}
            className="card c4 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/90 border border-[#8b5cf6]/30 backdrop-blur-md shadow-[0_12px_32px_rgba(139,92,246,0.2)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-[#181824]/60 tracking-wider">
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
            className="card c5 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/90 border border-[#8b5cf6]/30 backdrop-blur-md shadow-[0_12px_32px_rgba(139,92,246,0.2)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-[#181824]/60 tracking-wider">
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
            className="card c6 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/90 border border-[#8b5cf6]/30 backdrop-blur-md shadow-[0_12px_32px_rgba(139,92,246,0.2)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-[#181824]/60 tracking-wider">
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
            className="card c7 absolute w-[84px] h-[84px] md:w-[88px] md:h-[88px] rounded-[22px] grid place-items-center bg-white/90 border border-[#8b5cf6]/30 backdrop-blur-md shadow-[0_12px_32px_rgba(139,92,246,0.2)] will-change-transform"
          >
            <span className="num absolute top-2 left-2.5 font-mono text-[10px] leading-none text-[#181824]/60 tracking-wider">
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

        {/* Percentage Counter at bottom */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center">
          <div
            ref={counterRef}
            className="counter font-mono text-sm tracking-widest text-[#181824]/75 bg-black/[0.04] border border-black/10 px-4 py-1.5 rounded-full shadow-sm"
          >
            0%
          </div>
        </div>
      </div>
    </div>
  );
}
