'use client';

import { useRef } from 'react';
import { ensureGsap } from '@/lib/gsap';
import { useIsoLayoutEffect } from '@/lib/useIsoLayoutEffect';

/**
 * Smooth route entry. Runs before paint (no flash of the new page) and animates
 * opacity only — transforms/clip-paths on this wrapper would break sticky and fixed
 * descendants mid-transition and cause a visible jump when they are cleared.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const { gsap } = ensureGsap();
    const el = ref.current;
    if (!el) return;
    // A card → hero (or hero → card) transition owns this navigation; don't fight it.
    if (document.documentElement.dataset.pt) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tween = gsap.fromTo(
      el,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power2.out', clearProps: 'opacity' },
    );
    return () => { tween.kill(); };
  }, []);

  return <div ref={ref}>{children}</div>;
}
