'use client';

import { useEffect, useRef, useId, type CSSProperties, type PointerEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createProjectBendMap, easeProjectBend, nextProjectScroll } from '@/lib/project-bend';

gsap.registerPlugin(ScrollTrigger);
export interface ProjectCard { slug: string; title: string; image: string; href: string; tags: string; archive: boolean }

function RollingTitle({ text }: { text: string }) {
  return <span className="rolling-title" aria-hidden="true">{text.split(' ').map((word, w) => <span className="rolling-word" key={w}>{[...word].map((letter, i) => <span className="rolling-letter" key={i}><span style={{ '--delay': `${(w * 3 + i) * 14}ms` } as CSSProperties}><span>{letter}</span><span>{letter}</span><span>{letter}</span></span></span>)}<span className="rolling-space"> </span></span>)}</span>;
}

function ProjectTile({ project, index }: { project: ProjectCard; index: number }) {
  const filterId = `project-bend-${useId().replace(/:/g, '')}`;
  const plane = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const ticker = useRef<gsap.core.Tween | null>(null);
  useEffect(() => () => { ticker.current?.kill(); if (plane.current) gsap.killTweensOf(plane.current); }, []);
  const scramble = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !tag.current) return;
    ticker.current?.kill();
    const state = { progress: 0 };
    ticker.current = gsap.to(state, { progress: 1, duration: .65, ease: 'none', onUpdate: () => {
      if (tag.current) tag.current.textContent = [...project.tags].map((c, i) => i < project.tags.length * state.progress || c === ' ' || c === '·' ? c : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
    }, onComplete: () => { if (tag.current) tag.current.textContent = project.tags; } });
  };
  const move = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - .5;
    const y = (event.clientY - box.top) / box.height - .5;
    gsap.to(plane.current, { rotateY: x * 8, rotateX: -y * 7, x: x * 8, y: y * 8, duration: .7, ease: 'power2.out', overwrite: true });
  };
  const reset = () => { gsap.to(plane.current, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: .9, overwrite: true }); };
  return <article className={`project-tile project-theme-${index % 6}`} data-lane={index % 2}>
    <Link href={project.href} className="project-card" onPointerEnter={scramble} onFocus={scramble} onPointerMove={move} onPointerLeave={reset} aria-label={`${project.title}${project.archive ? ' — original case study' : ' — view project'}`}>
      <svg className="project-filter-defs" width="0" height="0" aria-hidden="true"><defs>
        <filter id={filterId} x="-12%" y="-25%" width="124%" height="150%" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage className="project-bend-map" preserveAspectRatio="none" result="bend" />
          <feDisplacementMap className="project-bend-displacement" in="SourceGraphic" in2="bend" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs></svg>
      <div className="project-surface" data-bend-filter={filterId}><div className="project-window">
        <div className="project-warp">
          <div className="project-warp-inner">
            <div className="project-parallax">
              <div className="project-landscape" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
              <div className="project-brand-plane" ref={plane}>
                <div className="project-brand-sheet"><Image unoptimized={project.image.startsWith('/api/cms-media/') || project.image.startsWith('http')} src={project.image} alt="" fill sizes="(max-width: 700px) 75vw, 36vw" className="brand-image" /></div>
              </div>
            </div>
          </div>
        </div>
        <span className="project-edition" aria-hidden="true">THINKLAB®<br />COLLABORATIONS — {String(index + 1).padStart(2, '0')}</span>
        <span className="project-view"><ArrowUpRight size={23} /><span>Explore project</span></span>
      </div></div>
      <div className="project-meta"><span className="project-tags" aria-hidden="true" ref={tag}>{project.tags}</span><h3><ArrowUpRight className="project-title-arrow" aria-hidden="true" /><span className="sr-only">{project.title}</span><RollingTitle text={project.title} /></h3></div>
    </Link>
  </article>;
}

/** Curve the actual image pixels, including the rounded silhouette, with scroll momentum. */
function useScrollWarp(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const tiles = Array.from(root.current?.querySelectorAll<HTMLElement>('.project-tile') ?? []);
      if (!tiles.length) return;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 129;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.putImageData(new ImageData(createProjectBendMap(), 129, 129), 0, 0);
      const map = canvas.toDataURL();
      const surfaces = tiles.map(tile => tile.querySelector<HTMLElement>('.project-surface')!);
      const filters = tiles.map(tile => tile.querySelector<SVGFEDisplacementMapElement>('.project-bend-displacement')!);
      const maps = tiles.map(tile => tile.querySelector<SVGFEImageElement>('.project-bend-map')!);
      maps.forEach(image => image.setAttribute('href', map));
      const live = new Set<number>();
      let previousY = window.scrollY;
      let previousTime = performance.now();
      let frame = 0;
      let momentum = 0;
      let wheelTarget: number | null = null;
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        const i = tiles.indexOf(entry.target as HTMLElement);
        if (entry.isIntersecting) live.add(i);
        else { live.delete(i); surfaces[i].style.filter = ''; filters[i].setAttribute('scale', '0'); }
      }), { rootMargin: '15% 0px' });
      tiles.forEach(tile => observer.observe(tile));
      const tick = (now: number) => {
        const dt = Math.max(1, now - previousTime);
        if (wheelTarget !== null) {
          const next = nextProjectScroll(window.scrollY, wheelTarget, dt);
          window.scrollTo(0, next);
          if (next === wheelTarget) wheelTarget = null;
        }
        const delta = window.scrollY - previousY;
        previousY = window.scrollY;
        previousTime = now;
        momentum = easeProjectBend(momentum, delta, dt, window.innerHeight);
        const ripple = Math.min(.15, momentum * .5);
        // The map stays anchored to the screen, not the individual card.
        const boxes = surfaces.map(surface => surface.getBoundingClientRect());
        live.forEach(i => {
          const box = boxes[i];
          maps[i].setAttribute('x', String(-box.left));
          maps[i].setAttribute('y', String(-box.top));
          maps[i].setAttribute('width', String(window.innerWidth));
          maps[i].setAttribute('height', String(window.innerHeight));
          filters[i].setAttribute('scale', (box.width * ripple).toFixed(3));
          surfaces[i].style.filter = ripple ? `url("#${surfaces[i].dataset.bendFilter}")` : '';
        });
        frame = momentum || wheelTarget !== null ? requestAnimationFrame(tick) : 0;
      };
      const wake = () => {
        if (!frame) { previousTime = performance.now() - 16; frame = requestAnimationFrame(tick); }
      };
      // Apply the reference's wheel easing only while this gallery is on screen.
      // Touch, keyboard and the original hero retain their native scroll behavior.
      const wheel = (event: WheelEvent) => {
        const bounds = root.current?.getBoundingClientRect();
        if (!bounds || bounds.bottom <= 0 || bounds.top >= window.innerHeight || event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
          wheelTarget = null;
          return;
        }
        const target = event.target;
        if (target instanceof Element && target.closest('input, textarea, select, [role="dialog"]')) return;
        event.preventDefault();
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
        wheelTarget = Math.max(0, Math.min(document.documentElement.scrollHeight - window.innerHeight, (wheelTarget ?? window.scrollY) + event.deltaY * unit));
        wake();
      };
      const cancelWheel = () => { wheelTarget = null; };
      window.addEventListener('wheel', wheel, { passive: false });
      window.addEventListener('pointerdown', cancelWheel);
      window.addEventListener('keydown', cancelWheel);
      window.addEventListener('touchstart', cancelWheel, { passive: true });
      window.addEventListener('scroll', wake, { passive: true });
      window.addEventListener('resize', wake);
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('wheel', wheel);
        window.removeEventListener('pointerdown', cancelWheel);
        window.removeEventListener('keydown', cancelWheel);
        window.removeEventListener('touchstart', cancelWheel);
        window.removeEventListener('scroll', wake);
        window.removeEventListener('resize', wake);
        observer.disconnect();
        surfaces.forEach(surface => { surface.style.filter = ''; });
        filters.forEach(filter => filter.setAttribute('scale', '0'));
      };
    });
    return () => media.revert();
  }, [root]);
}

export default function ProjectGallery({ projects }: { projects: ProjectCard[] }) {
  const root = useRef<HTMLDivElement>(null);
  useScrollWarp(root);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('.project-tile').forEach(tile => {
          const window_ = tile.querySelector('.project-window');
          const inner = tile.querySelector('.project-warp-inner');
          const lane = Number(tile.dataset.lane);
          // The pair opens out from the centre while its rounded windows expand.
          const entrance = gsap.timeline({ paused: true });
          entrance.fromTo(window_, { scale: .7, x: () => window.innerWidth * (lane ? -.05 : .05), rotation: lane ? 2.86 : -2.86 }, { scale: 1, x: 0, rotation: 0, duration: 2, ease: 'expo.out', clearProps: 'transform' }, 0);
          entrance.fromTo(inner, { scale: 1.07 }, { scale: 1, duration: 1.5, ease: 'expo.out', clearProps: 'transform' }, 0);
          ScrollTrigger.create({ trigger: tile, start: 'top bottom', end: 'bottom top', onEnter: () => entrance.restart(), onEnterBack: () => entrance.restart() });
        });
      }, root);
      return () => context.revert();
    });
    return () => media.revert();
  }, [projects]);
  return <div ref={root} className="project-gallery">{projects.map((project, index) => <ProjectTile key={project.slug} project={project} index={index} />)}</div>;
}
