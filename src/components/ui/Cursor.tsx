'use client';

import { useEffect, useRef } from 'react';

/**
 * The filament follows the cursor — a droplet of light with a lagging halo.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const halo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const d = dot.current!;
    const h = halo.current!;
    let x = -100;
    let y = -100;
    let hx = -100;
    let hy = -100;
    let hot = false;
    let raf = 0;

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
    };
    const over = (e: Event) => {
      const t = e.target as HTMLElement | null;
      hot = !!t?.closest?.('a, button, [data-cursor], input, textarea, select, [role="button"]');
    };

    const loop = () => {
      hx += (x - hx) * 0.16;
      hy += (y - hy) * 0.16;
      const s = hot ? 2.6 : 1;
      d.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      h.style.transform = `translate3d(${hx}px, ${hy}px, 0) translate(-50%, -50%) scale(${s})`;
      h.style.opacity = hot ? '0.9' : '0.5';
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('mouseover', over, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('mouseover', over);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[95] hidden [@media(pointer:fine)]:block" aria-hidden="true">
      <div
        ref={halo}
        className="absolute h-10 w-10 rounded-full border border-[rgba(162,128,255,0.55)] transition-opacity duration-300"
        style={{ boxShadow: '0 0 24px rgba(126,111,240,0.25) inset, 0 0 18px rgba(126,111,240,0.18)' }}
      />
      <div
        ref={dot}
        className="absolute h-1.5 w-1.5 rounded-full bg-[#fcfcf7]"
        style={{ boxShadow: '0 0 10px rgba(252,252,247,0.9), 0 0 22px rgba(162,128,255,0.7)' }}
      />
    </div>
  );
}
