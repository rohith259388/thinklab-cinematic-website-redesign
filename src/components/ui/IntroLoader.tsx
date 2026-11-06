'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motion } from '@/lib/motion';

/**
 * thinklab identity assembly.
 *
 *  0.00s  A single node ignites.
 *  0.28s  It expands into a neural network with travelling data packets.
 *  1.15s  Service nodes are tagged.
 *  1.85s  Particles fall inward and assemble the wordmark.
 *  2.85s  The particles resolve into the flat white "thinklab®" lockup.
 *  3.60s  Brief hold on the final logo.
 *  4.05s  Circular bubble expands from the center, revealing the Home page underneath!
 */

const TIMELINE = {
  expandStart: 280,
  edgesFadeStart: 1600,
  labelStart: 1150,
  labelStep: 80,
  labelFadeStart: 1750,
  dustStart: 750,
  gatherStart: 1850,
  gatherDuration: 1050,
  lockStart: 2850,
  lockEnd: 3250,
  dustFadeStart: 2950,
  end: 3600,
  holdBeforeReveal: 450, // clean pause on assembled logo before portal burst
} as const;

const SERVICE_LABELS = ['Websites', 'SEO', 'Marketing', 'Branding', 'CRM', 'AI'];
/** Hub indices that carry a service tag, spread so the labels don't crowd the centre. */
const LABEL_HUBS = [10, 22, 34, 46, 56, 66];

const HUB_COUNT = 72;
const PARTICLE_COUNT = 1400;
const WORD = 'thinklab';
const WORD_FONT = '"Thinklab Sans", Inter, ui-sans-serif, system-ui, sans-serif';
const WORD_TRACKING = '-0.02em';
const VIOLET: RGB = [135, 65, 244];
const BLUE: RGB = [79, 195, 247];

type RGB = [number, number, number];

type Particle = {
  rx: number;
  ry: number;
  tx: number;
  ty: number;
  delay: number;
  appear: number;
  phase: number;
  swirl: number;
  hub: boolean;
  hubIndex: number;
  label?: string;
  labelIndex: number;
  rgb: RGB;
};

type Edge = { a: number; b: number; offset: number; speed: number };

type Layout = {
  cx: number;
  cy: number;
  R: number;
  fontSize: number;
  wordLeft: number;
  baseline: number;
  wordWidth: number;
  ascent: number;
  markSize: number;
  markX: number;
  markTop: number;
};

type Mode = 'play' | 'hold' | 'revealing';

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function setWordFont(ctx: CanvasRenderingContext2D, size: number) {
  ctx.font = `900 ${size}px ${WORD_FONT}`;
  ctx.letterSpacing = WORD_TRACKING;
}

function drawRegistered(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const radius = size / 2;
  const cx = x + radius;
  const cy = y + radius;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.84, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1.05, size * 0.07);
  ctx.stroke();
  ctx.font = `500 ${size * 0.56}px ${WORD_FONT}`;
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', cx, cy + size * 0.02);
}

export default function IntroLoader() {
  const [gone, setGone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Lock scroll during intro animation
    document.documentElement.style.overflow = 'hidden';
    if (typeof window !== 'undefined') {
      window.__lenis?.stop();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cancelled = false;
    let raf = 0;
    let mode: Mode = 'play';
    let origin = 0;
    let W = 0;
    let H = 0;
    let layout: Layout = {
      cx: 0,
      cy: 0,
      R: 0,
      fontSize: 100,
      wordLeft: 0,
      baseline: 0,
      wordWidth: 0,
      ascent: 70,
      markSize: 20,
      markX: 0,
      markTop: 0,
    };
    let particles: Particle[] = [];
    let edges: Edge[] = [];

    const positionOf = (p: Particle, t: number): [number, number] => {
      const { cx, cy } = layout;
      let x = p.rx + Math.sin(t * 0.0008 + p.phase) * 3;
      let y = p.ry + Math.cos(t * 0.001 + p.phase) * 3;

      if (p.hub) {
        const e = easeOutCubic(clamp((t - TIMELINE.expandStart - p.hubIndex * 7) / 1000));
        x = lerp(cx, x, e);
        y = lerp(cy, y, e);
      }

      const g = easeInOutCubic(clamp((t - TIMELINE.gatherStart - p.delay * 280) / TIMELINE.gatherDuration));
      if (g > 0) {
        const wobble = Math.sin(g * Math.PI) * p.swirl;
        x = lerp(x, p.tx, g) + Math.cos(p.phase) * wobble;
        y = lerp(y, p.ty, g) + Math.sin(p.phase) * wobble;
      }
      return [x, y];
    };

    const paintWord = (target: CanvasRenderingContext2D) => {
      setWordFont(target, layout.fontSize);
      target.textAlign = 'left';
      target.textBaseline = 'alphabetic';
      target.fillText(WORD, layout.wordLeft, layout.baseline);
    };

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W * 0.38, H * 0.42, 380);

      const targetWordWidth = Math.min(W * 0.78, 560);
      let fontSize = Math.round(targetWordWidth * 0.24);
      setWordFont(ctx, fontSize);
      let metrics = ctx.measureText(WORD);
      let measuredWidth = metrics.width;
      if (measuredWidth > 0) {
        fontSize = Math.round((fontSize * targetWordWidth) / measuredWidth);
        setWordFont(ctx, fontSize);
        metrics = ctx.measureText(WORD);
        measuredWidth = metrics.width;
      }

      const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.72;
      const markSize = Math.max(14, Math.round(fontSize * 0.19));
      const markGap = Math.max(4, Math.round(fontSize * 0.05));
      const totalWidth = measuredWidth + markGap + markSize;
      const wordLeft = cx - totalWidth / 2;
      const baseline = cy + ascent / 2;
      const markX = wordLeft + measuredWidth + markGap;
      const markTop = baseline - ascent;

      layout = {
        cx,
        cy,
        R,
        fontSize,
        wordLeft,
        baseline,
        wordWidth: measuredWidth,
        ascent,
        markSize,
        markX,
        markTop,
      };

      const off = document.createElement('canvas');
      off.width = Math.round(W);
      off.height = Math.round(H);
      const octx = off.getContext('2d');
      if (!octx) return;
      octx.fillStyle = '#ffffff';
      paintWord(octx);
      drawRegistered(octx, markX, markTop, markSize);

      const img = octx.getImageData(0, 0, off.width, off.height);
      const data = img.data;
      const hits: [number, number][] = [];
      const step = Math.max(2, Math.round(fontSize / 34));
      const minX = Math.max(0, Math.floor(wordLeft - 4));
      const maxX = Math.min(off.width, Math.ceil(markX + markSize + 4));
      const minY = Math.max(0, Math.floor(markTop - 4));
      const maxY = Math.min(off.height, Math.ceil(baseline + 10));

      for (let y = minY; y < maxY; y += step) {
        for (let x = minX; x < maxX; x += step) {
          const idx = (y * off.width + x) * 4;
          if (data[idx + 3] > 110) {
            hits.push([x + (Math.random() - 0.5) * step * 0.5, y + (Math.random() - 0.5) * step * 0.5]);
          }
        }
      }

      const targets = shuffle(hits);
      const targetCount = targets.length;

      particles = [];

      for (let i = 0; i < HUB_COUNT; i++) {
        const u = (i + 1) / (HUB_COUNT + 1);
        const radius = R * (0.18 + 0.82 * Math.sqrt(u)) * (0.88 + Math.random() * 0.24);
        const theta = i * 2.399963 + (Math.random() - 0.5) * 0.3;
        const rx = cx + Math.cos(theta) * radius;
        const ry = cy + Math.sin(theta) * radius;

        const target = targets[i % targetCount] || [cx, cy];
        const distFromCenter = Math.hypot(target[0] - cx, target[1] - cy);
        const tColor = clamp(distFromCenter / (targetWordWidth / 2));
        const rgb = mixRGB(VIOLET, BLUE, tColor);

        const labelIdx = LABEL_HUBS.indexOf(i);

        particles.push({
          rx,
          ry,
          tx: target[0],
          ty: target[1],
          delay: (rx - (cx - R)) / (2 * R),
          appear: Math.random() * 300,
          phase: Math.random() * Math.PI * 2,
          swirl: (Math.random() - 0.5) * 40,
          hub: true,
          hubIndex: i,
          label: labelIdx >= 0 ? SERVICE_LABELS[labelIdx] : undefined,
          labelIndex: labelIdx >= 0 ? labelIdx : -1,
          rgb,
        });
      }

      for (let i = HUB_COUNT; i < PARTICLE_COUNT; i++) {
        const u = Math.random();
        const radius = R * (0.05 + 0.95 * Math.sqrt(u)) * (0.85 + Math.random() * 0.3);
        const theta = Math.random() * Math.PI * 2;
        const rx = cx + Math.cos(theta) * radius;
        const ry = cy + Math.sin(theta) * radius;

        const target = targets[i % targetCount] || [cx, cy];
        const distFromCenter = Math.hypot(target[0] - cx, target[1] - cy);
        const tColor = clamp(distFromCenter / (targetWordWidth / 2));
        const rgb = mixRGB(VIOLET, BLUE, tColor);

        particles.push({
          rx,
          ry,
          tx: target[0],
          ty: target[1],
          delay: Math.random(),
          appear: Math.random() * 600,
          phase: Math.random() * Math.PI * 2,
          swirl: (Math.random() - 0.5) * 55,
          hub: false,
          hubIndex: -1,
          labelIndex: -1,
          rgb,
        });
      }

      edges = [];
      const maxDist = R * 0.32;
      const maxDistSq = maxDist * maxDist;
      for (let i = 0; i < HUB_COUNT; i++) {
        let connected = 0;
        for (let j = i + 1; j < HUB_COUNT; j++) {
          const dx = particles[i].rx - particles[j].rx;
          const dy = particles[i].ry - particles[j].ry;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxDistSq) {
            edges.push({
              a: i,
              b: j,
              offset: Math.random(),
              speed: 0.6 + Math.random() * 0.8,
            });
            connected++;
            if (connected >= 3) break;
          }
        }
      }
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);

      const edgesFade = 1 - clamp((t - TIMELINE.edgesFadeStart) / 480);
      if (edgesFade > 0.01) {
        ctx.lineWidth = 1;
        for (const e of edges) {
          const pA = particles[e.a];
          const pB = particles[e.b];
          const appearA = clamp((t - TIMELINE.expandStart - pA.hubIndex * 7) / 440);
          const appearB = clamp((t - TIMELINE.expandStart - pB.hubIndex * 7) / 440);
          const alpha = appearA * appearB * edgesFade * 0.28;
          if (alpha <= 0.01) continue;

          const [ax, ay] = positionOf(pA, t);
          const [bx, by] = positionOf(pB, t);

          ctx.strokeStyle = `rgba(135, 65, 244, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();

          const pulse = (t * 0.0009 * e.speed + e.offset) % 1;
          const px = lerp(ax, bx, pulse);
          const py = lerp(ay, by, pulse);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 2.2})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const dustFade = 1 - clamp((t - TIMELINE.dustFadeStart) / 360);
      const lockP = clamp((t - TIMELINE.lockStart) / (TIMELINE.lockEnd - TIMELINE.lockStart));
      const whiten = clamp((t - TIMELINE.gatherStart) / (TIMELINE.gatherDuration + 220));

      for (const p of particles) {
        const [x, y] = positionOf(p, t);
        if (p.hub) {
          const appear = p.hubIndex === 0 ? clamp(t / 340) : clamp((t - TIMELINE.expandStart - p.hubIndex * 7) / 280);
          const a = appear * dustFade;
          if (a <= 0.01) continue;
          ctx.fillStyle = `rgba(135, 65, 244, ${0.16 * a * (1 - whiten)})`;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
          ctx.beginPath();
          ctx.arc(x, y, lerp(2.6, 1.5, lockP), 0, Math.PI * 2);
          ctx.fill();
        } else {
          const appear = clamp((t - TIMELINE.dustStart - p.appear) / 580);
          const a = appear * dustFade * 0.9;
          if (a <= 0.01) continue;
          const rgb = mixRGB(p.rgb, [255, 255, 255], whiten);
          ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const p of particles) {
        if (!p.label) continue;
        const labelA =
          clamp((t - TIMELINE.labelStart - p.labelIndex * TIMELINE.labelStep) / 280) *
          (1 - clamp((t - TIMELINE.labelFadeStart) / 200));
        if (labelA <= 0.01) continue;

        const [x, y] = positionOf(p, t);
        const text = p.label.toUpperCase();
        ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
        ctx.letterSpacing = '0.04em';
        const textWidth = ctx.measureText(text).width;
        const padX = 10;
        const h = 22;
        const bx = x + 14;
        const by = y - h / 2 - 12;

        ctx.save();
        ctx.globalAlpha = labelA;
        ctx.fillStyle = 'rgba(10, 10, 16, 0.88)';
        ctx.strokeStyle = 'rgba(135, 65, 244, 0.75)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, textWidth + padX * 2, h, 11);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, bx + padX, by + h / 2 + 0.5);
        ctx.restore();
      }

      const crispA = easeOutCubic(lockP);
      if (crispA > 0.002) {
        ctx.save();
        ctx.globalAlpha = crispA;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
        ctx.shadowBlur = 22 * (1 - lockP);
        paintWord(ctx);
        ctx.shadowBlur = 0;
        drawRegistered(ctx, layout.markX, layout.markTop, layout.markSize);
        ctx.restore();
      }
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    /**
     * Circular Bubble Expansion:
     * Punches through the loader container from the center outward
     * to reveal the 3D cinematic HomePage underneath!
     */
    let revealStarted = false;
    const triggerCircularBubbleReveal = () => {
      if (revealStarted) return;
      revealStarted = true;
      mode = 'revealing';

      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const maxPortalRadius = (Math.hypot(winW, winH) / 2) * 1.35;
      const portalState = { radius: 0 };

      // Dispatch event to activate HomeJourney and 3D Bulb entrance
      motion.ready = true;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('thinklab:ready'));
      }

      gsap.to(portalState, {
        radius: maxPortalRadius,
        duration: 1.45,
        ease: 'power2.inOut',
        onUpdate: () => {
          const r = portalState.radius;
          if (containerRef.current) {
            const mask = `radial-gradient(circle at 50% 50%, transparent ${r}px, black ${r + 2.5}px)`;
            containerRef.current.style.maskImage = mask;
            containerRef.current.style.webkitMaskImage = mask;
          }
        },
        onComplete: () => {
          stop();
          document.documentElement.style.overflow = '';
          if (typeof window !== 'undefined') {
            window.__lenis?.start();
          }
          setGone(true);
        },
      });
    };

    const tick = (now: number) => {
      if (cancelled) return;
      if (!origin) origin = now;
      const elapsed = now - origin;

      if (mode === 'play') {
        render(Math.min(elapsed, TIMELINE.end));
        if (elapsed >= TIMELINE.end) {
          mode = 'hold';
          origin = now;
        }
      } else if (mode === 'hold') {
        render(TIMELINE.end);
        // Hold on the finished logo briefly, then trigger the circular bubble expansion!
        if (elapsed >= TIMELINE.holdBeforeReveal) {
          triggerCircularBubbleReveal();
        }
      } else if (mode === 'revealing') {
        // Keep the rendered lockup sharp while the bubble expands
        render(TIMELINE.end);
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf && !cancelled) raf = requestAnimationFrame(tick);
    };

    const boot = () => {
      if (cancelled) return;
      build();
      if (reduceMotion) {
        render(TIMELINE.end);
        triggerCircularBubbleReveal();
        return;
      }
      origin = 0;
      mode = 'play';
      start();
    };

    const onResize = () => {
      if (cancelled || W === 0) return;
      build();
      const t = mode === 'play' && origin ? Math.min(performance.now() - origin, TIMELINE.end) : TIMELINE.end;
      render(t);
    };

    const fontReady = Promise.race([
      Promise.all([
        document.fonts.load(`900 120px ${WORD_FONT}`),
        document.fonts.load(`500 16px ${WORD_FONT}`),
      ]),
      new Promise((resolve) => window.setTimeout(resolve, 2000)),
    ]);
    fontReady.then(boot);
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      stop();
      document.documentElement.style.overflow = '';
      window.removeEventListener('resize', onResize);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] overflow-hidden bg-[#050505] text-white pointer-events-none select-none will-change-transform"
      aria-label="thinklab"
    >
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]"
        aria-hidden="true"
      />
    </div>
  );
}
