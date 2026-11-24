'use client';

import { useEffect, useRef } from 'react';
import { ensureGsap } from '@/lib/gsap';

/**
 * Page transitions honour the motion law: nothing fades, everything transforms.
 * Each new room of the laboratory unfolds out of the centre and locks into place.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { gsap } = ensureGsap();
    const el = ref.current;
    if (!el) return;
    // A card → hero (or hero → card) transition owns this navigation; don't fight it.
    if (document.documentElement.dataset.pt) return;
    gsap.fromTo(
      el,
      { clipPath: 'inset(9% 4% 9% 4% round 32px)', y: 34, autoAlpha: 0.001 },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0px)',
        y: 0,
        autoAlpha: 1,
        duration: 1.05,
        ease: 'power3.out',
        clearProps: 'clipPath,transform,opacity,visibility',
      },
    );
  }, []);

  return <div ref={ref}>{children}</div>;
}
