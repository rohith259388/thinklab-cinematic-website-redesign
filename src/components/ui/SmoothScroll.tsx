'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { ensureGsap, gsap, ScrollTrigger } from '@/lib/gsap';
import 'lenis/dist/lenis.css';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export default function SmoothScroll() {
  const pathname = usePathname();
  const firstRoute = useRef(true);

  // On client navigation: snap Lenis to the top instantly (otherwise it eases from the
  // old page's offset and the new page visibly jumps), then do ONE ScrollTrigger refresh
  // once the new layout and its images/fonts have settled.
  useEffect(() => {
    if (firstRoute.current) { firstRoute.current = false; return; }
    if (!window.location.hash) {
      window.__lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => ScrollTrigger.refresh()); });
    const late = setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); clearTimeout(late); };
  }, [pathname]);

  useEffect(() => {
    ensureGsap();

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Initialize Lenis with smooth physics matching lusion.co
    const lenis = new Lenis({
      lerp: 0.085, // Silky smooth inertia curve (tested on Windows & Mac)
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 0.85, // Prevents harsh steps on Windows mouse wheels
      touchMultiplier: 1.15,
      syncTouch: false, // Ensures smooth, native-feel scrolling on mobile & low-end devices
      autoRaf: false, // Driven synchronously via GSAP ticker for 0ms lag
    });

    window.__lenis = lenis;

    // Sync Lenis scroll with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis directly in GSAP's RAF loop
    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerUpdate);
    // Disable lagSmoothing so tab defocus or slow frames on low-end devices don't cause scroll jumping
    gsap.ticker.lagSmoothing(0);

    // Smooth scroll for anchor clicks (e.g., #studio, #works, etc.)
    const onAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!target) return;
      const href = target.getAttribute('href');
      if (href && href.length > 1) {
        const dest = document.querySelector(href);
        if (dest) {
          e.preventDefault();
          lenis.scrollTo(dest as HTMLElement, { offset: -70, duration: 1.4 });
        }
      }
    };
    document.addEventListener('click', onAnchorClick);

    // Refresh ScrollTrigger after fonts and layout settle
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 400);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad, { once: true });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      clearTimeout(refreshTimer);
      window.removeEventListener('load', onLoad);
      document.removeEventListener('click', onAnchorClick);
      gsap.ticker.remove(tickerUpdate);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return null;
}
