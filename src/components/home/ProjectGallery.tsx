'use client';

import { useEffect, useRef, useId, useState, type CSSProperties, type PointerEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createProjectBendMap, easeProjectBend, nextProjectScroll } from '@/lib/project-bend';

gsap.registerPlugin(ScrollTrigger);

export interface ProjectCard {
  slug: string;
  title: string;
  image: string;
  href: string;
  tags: string;
  archive: boolean;
  summary?: string;
  category?: string;
}

export interface ProjectGalleryProps {
  projects: ProjectCard[];
  mode?: 'stacked' | 'grid';
}

const THEME_ACCENTS = [
  {
    bg: 'radial-gradient(ellipse at 85% 15%, rgba(139, 92, 246, 0.18), transparent 70%)',
    glow: 'rgba(139, 92, 246, 0.4)',
    border: 'rgba(139, 92, 246, 0.25)',
    pill: '#a78bfa',
    badgeBg: 'rgba(139, 92, 246, 0.12)',
  },
  {
    bg: 'radial-gradient(ellipse at 85% 15%, rgba(245, 158, 11, 0.18), transparent 70%)',
    glow: 'rgba(245, 158, 11, 0.4)',
    border: 'rgba(245, 158, 11, 0.25)',
    pill: '#fbbf24',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
  },
  {
    bg: 'radial-gradient(ellipse at 85% 15%, rgba(16, 185, 129, 0.18), transparent 70%)',
    glow: 'rgba(16, 185, 129, 0.4)',
    border: 'rgba(16, 185, 129, 0.25)',
    pill: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
  },
  {
    bg: 'radial-gradient(ellipse at 85% 15%, rgba(244, 63, 94, 0.18), transparent 70%)',
    glow: 'rgba(244, 63, 94, 0.4)',
    border: 'rgba(244, 63, 94, 0.25)',
    pill: '#fb7185',
    badgeBg: 'rgba(244, 63, 94, 0.12)',
  },
];

/** 3D Tilting Brand Visual Showcase */
function StackedProjectCard({
  project,
  index,
  total,
  cardRef,
}: {
  project: ProjectCard;
  index: number;
  total: number;
  cardRef: (el: HTMLElement | null) => void;
}) {
  const planeRef = useRef<HTMLDivElement>(null);
  const theme = THEME_ACCENTS[index % THEME_ACCENTS.length];

  const handlePointerMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches || !planeRef.current) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width - 0.5;
    const y = (e.clientY - box.top) / box.height - 0.5;
    gsap.to(planeRef.current, {
      rotateY: x * 12,
      rotateX: -y * 10,
      x: x * 10,
      y: y * 8,
      duration: 0.6,
      ease: 'power2.out',
      overwrite: true,
    });
  };

  const handlePointerLeave = () => {
    if (!planeRef.current) return;
    gsap.to(planeRef.current, {
      rotateX: 0,
      rotateY: 0,
      x: 0,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      overwrite: true,
    });
  };

  const tagsList = project.tags
    .split(/[·•]/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && !t.includes('archive'));

  return (
    <article
      ref={cardRef}
      className="project-stacked-card sticky w-full max-w-5xl mx-auto rounded-[24px] sm:rounded-[30px] md:rounded-[36px] overflow-hidden border border-white/10 bg-[#0c0c14]/95 backdrop-blur-2xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85)] group transition-all duration-500 hover:border-white/25"
      style={{
        top: `clamp(75px, 9vh, 96px)`,
        zIndex: index + 1,
        transformOrigin: 'top center',
        willChange: 'transform, filter',
      }}
    >
      {/* Dynamic atmospheric ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{ background: theme.bg }}
        aria-hidden="true"
      />

      {/* Photorealistic dark depth occlusion overlay animated by ScrollTrigger */}
      <div
        className="card-stack-overlay pointer-events-none absolute inset-0 bg-[#07070b] opacity-0 z-30 transition-opacity"
        aria-hidden="true"
      />

      {/* Inner Card Container */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between min-h-[460px] md:min-h-[480px]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 md:pb-5">
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-xs sm:text-sm font-semibold tracking-widest px-3 py-1 rounded-full border"
              style={{
                color: theme.pill,
                backgroundColor: theme.badgeBg,
                borderColor: theme.border,
              }}
            >
              {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-white/50">
              {project.category || 'Selected Work'}
            </span>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono tracking-[0.25em] text-white/40 uppercase">
            THINKLAB® COLLABORATION
          </span>
        </div>

        {/* Content & Visual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center my-auto py-5">
          {/* Left Column: Title, Description, Tags */}
          <div className="md:col-span-7 flex flex-col justify-center">
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-white group-hover:text-white/90 transition-colors leading-[1.15]">
              <Link href={project.href} className="focus:outline-none hover:underline decoration-white/30 underline-offset-8">
                {project.title}
              </Link>
            </h3>

            {project.summary && (
              <p className="mt-4 text-sm sm:text-base text-white/70 font-light leading-relaxed line-clamp-3 md:line-clamp-4 max-w-xl">
                {project.summary}
              </p>
            )}

            {tagsList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {tagsList.map((tag, t) => (
                  <span
                    key={t}
                    className="text-[10px] sm:text-[11px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: 3D Tilting Brand Showcase */}
          <div className="md:col-span-5 flex items-center justify-center">
            <Link
              href={project.href}
              className="relative w-full aspect-[16/11] rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4 sm:p-6 flex items-center justify-center group/visual shadow-inner"
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              aria-label={`View ${project.title} project showcase`}
            >
              {/* Radial glow underneath image */}
              <div
                className="absolute inset-0 opacity-40 group-hover/visual:opacity-70 transition-opacity pointer-events-none"
                style={{ background: `radial-gradient(circle at center, ${theme.glow}, transparent 70%)` }}
              />

              {/* 3D Tilting Sheet */}
              <div
                ref={planeRef}
                className="relative w-full h-full flex items-center justify-center transition-transform will-change-transform"
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 85vw, 35vw"
                  unoptimized={project.image.startsWith('/api/cms-media/') || project.image.startsWith('http')}
                  className="object-contain p-2 filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)] group-hover/visual:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom Bar: Action link & indicator */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4 md:pt-5">
          <Link
            href={project.href}
            className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-mono uppercase tracking-wider text-white hover:text-white/80 transition-all group/btn"
          >
            <span>Explore Case Study</span>
            <span
              className="w-8 h-8 rounded-full bg-white/10 group-hover/btn:bg-white group-hover/btn:text-black flex items-center justify-center transition-all duration-300 transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-0.5"
            >
              <ArrowUpRight size={16} />
            </span>
          </Link>

          <span className="text-[11px] font-mono tracking-widest text-white/40">
            [ 0{index + 1} ]
          </span>
        </div>
      </div>
    </article>
  );
}

/**
 * Directoo-style Stacked Project Cards Deck.
 * As user scrolls, each card sticks and smoothly scales down as newer cards stack on top.
 */
function StackedProjectDeck({ projects }: { projects: ProjectCard[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const cards = cardsRef.current.filter(Boolean) as HTMLElement[];
      if (cards.length < 2) return;

      const lastCard = cards[cards.length - 1];

      cards.forEach((card, i) => {
        if (i === cards.length - 1) return; // Last card stays pinned on top at scale 1.0

        const nextCard = cards[i + 1];
        // Scale down smoothly: e.g. 4 cards -> card 0 targets 0.865, card 1 targets 0.91, card 2 targets 0.955
        const targetScale = 1 - (cards.length - 1 - i) * 0.045;
        const overlay = card.querySelector<HTMLElement>('.card-stack-overlay');

        // Linear scroll-driven scale down as subsequent cards stack over
        gsap.to(card, {
          scale: targetScale,
          transformOrigin: 'top center',
          ease: 'none',
          scrollTrigger: {
            trigger: nextCard,
            endTrigger: lastCard,
            start: 'top 85%',
            end: 'top 96px',
            scrub: true,
          },
        });

        // Ambient dark occlusion overlay fading in behind newer cards
        if (overlay) {
          const targetOpacity = 0.45 * ((cards.length - 1 - i) / (cards.length - 1));
          gsap.to(overlay, {
            opacity: targetOpacity,
            ease: 'none',
            scrollTrigger: {
              trigger: nextCard,
              endTrigger: lastCard,
              start: 'top 85%',
              end: 'top 96px',
              scrub: true,
            },
          });
        }
      });

      ScrollTrigger.refresh();
    });

    return () => mm.revert();
  }, [projects]);

  return (
    <div
      ref={rootRef}
      className="project-stacked-deck relative w-full flex flex-col gap-14 sm:gap-18 md:gap-24 my-8 md:my-14 pb-16 md:pb-24"
    >
      {projects.map((project, index) => (
        <StackedProjectCard
          key={project.slug}
          project={project}
          index={index}
          total={projects.length}
          cardRef={(el) => {
            cardsRef.current[index] = el;
          }}
        />
      ))}
    </div>
  );
}

/* ========================================================================= */
/* GRID MODE (Retained for /projects index with 18+ cards)                    */
/* ========================================================================= */

function RollingTitle({ text }: { text: string }) {
  return (
    <span className="rolling-title" aria-hidden="true">
      {text.split(' ').map((word, w) => (
        <span className="rolling-word" key={w}>
          {[...word].map((letter, i) => (
            <span className="rolling-letter" key={i}>
              <span style={{ '--delay': `${(w * 3 + i) * 14}ms` } as CSSProperties}>
                <span>{letter}</span>
                <span>{letter}</span>
                <span>{letter}</span>
              </span>
            </span>
          ))}
          <span className="rolling-space"> </span>
        </span>
      ))}
    </span>
  );
}

function GridProjectTile({ project, index }: { project: ProjectCard; index: number }) {
  const filterId = `project-bend-${useId().replace(/:/g, '')}`;
  const plane = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const ticker = useRef<gsap.core.Tween | null>(null);

  useEffect(() => () => {
    ticker.current?.kill();
    if (plane.current) gsap.killTweensOf(plane.current);
  }, []);

  const scramble = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !tag.current) return;
    ticker.current?.kill();
    const state = { progress: 0 };
    ticker.current = gsap.to(state, {
      progress: 1,
      duration: 0.65,
      ease: 'none',
      onUpdate: () => {
        if (tag.current)
          tag.current.textContent = [...project.tags]
            .map((c, i) =>
              i < project.tags.length * state.progress || c === ' ' || c === '·'
                ? c
                : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
            )
            .join('');
      },
      onComplete: () => {
        if (tag.current) tag.current.textContent = project.tags;
      },
    });
  };

  const move = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    gsap.to(plane.current, {
      rotateY: x * 8,
      rotateX: -y * 7,
      x: x * 8,
      y: y * 8,
      duration: 0.7,
      ease: 'power2.out',
      overwrite: true,
    });
  };

  const reset = () => {
    gsap.to(plane.current, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.9, overwrite: true });
  };

  return (
    <article className={`project-tile project-theme-${index % 6}`} data-lane={index % 2}>
      <Link
        href={project.href}
        className="project-card"
        onPointerEnter={scramble}
        onFocus={scramble}
        onPointerMove={move}
        onPointerLeave={reset}
        aria-label={`${project.title}${project.archive ? ' — original case study' : ' — view project'}`}
      >
        <svg className="project-filter-defs" width="0" height="0" aria-hidden="true">
          <defs>
            <filter
              id={filterId}
              x="-12%"
              y="-25%"
              width="124%"
              height="150%"
              primitiveUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feImage className="project-bend-map" preserveAspectRatio="none" result="bend" />
              <feDisplacementMap
                className="project-bend-displacement"
                in="SourceGraphic"
                in2="bend"
                scale="0"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
        <div className="project-surface" data-bend-filter={filterId}>
          <div className="project-window">
            <div className="project-warp">
              <div className="project-warp-inner">
                <div className="project-parallax">
                  <div className="project-landscape" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="project-brand-plane" ref={plane}>
                    <div className="project-brand-sheet">
                      <Image
                        unoptimized={project.image.startsWith('/api/cms-media/') || project.image.startsWith('http')}
                        src={project.image}
                        alt=""
                        fill
                        sizes="(max-width: 700px) 75vw, 36vw"
                        className="brand-image"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <span className="project-edition" aria-hidden="true">
              THINKLAB®<br />
              COLLABORATIONS — {String(index + 1).padStart(2, '0')}
            </span>
            <span className="project-view">
              <ArrowUpRight size={23} />
              <span>Explore project</span>
            </span>
          </div>
        </div>
        <div className="project-meta">
          <span className="project-tags" aria-hidden="true" ref={tag}>
            {project.tags}
          </span>
          <h3>
            <ArrowUpRight className="project-title-arrow" aria-hidden="true" />
            <span className="sr-only">{project.title}</span>
            <RollingTitle text={project.title} />
          </h3>
        </div>
      </Link>
    </article>
  );
}

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
      const surfaces = tiles.map((tile) => tile.querySelector<HTMLElement>('.project-surface')!);
      const filters = tiles.map((tile) => tile.querySelector<SVGFEDisplacementMapElement>('.project-bend-displacement')!);
      const maps = tiles.map((tile) => tile.querySelector<SVGFEImageElement>('.project-bend-map')!);
      maps.forEach((image) => image.setAttribute('href', map));
      const live = new Set<number>();
      let previousY = window.scrollY;
      let previousTime = performance.now();
      let frame = 0;
      let momentum = 0;
      let wheelTarget: number | null = null;
      const observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            const i = tiles.indexOf(entry.target as HTMLElement);
            if (entry.isIntersecting) live.add(i);
            else {
              live.delete(i);
              surfaces[i].style.filter = '';
              filters[i].setAttribute('scale', '0');
            }
          }),
        { rootMargin: '15% 0px' }
      );
      tiles.forEach((tile) => observer.observe(tile));
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
        const ripple = Math.min(0.15, momentum * 0.5);
        const boxes = surfaces.map((surface) => surface.getBoundingClientRect());
        live.forEach((i) => {
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
        if (!frame) {
          previousTime = performance.now() - 16;
          frame = requestAnimationFrame(tick);
        }
      };
      const wheel = (event: WheelEvent) => {
        const bounds = root.current?.getBoundingClientRect();
        if (
          !bounds ||
          bounds.bottom <= 0 ||
          bounds.top >= window.innerHeight ||
          event.ctrlKey ||
          event.shiftKey ||
          Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ) {
          wheelTarget = null;
          return;
        }
        const target = event.target;
        if (target instanceof Element && target.closest('input, textarea, select, [role="dialog"]')) return;
        event.preventDefault();
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
        wheelTarget = Math.max(
          0,
          Math.min(
            document.documentElement.scrollHeight - window.innerHeight,
            (wheelTarget ?? window.scrollY) + event.deltaY * unit
          )
        );
        wake();
      };
      const cancelWheel = () => {
        wheelTarget = null;
      };
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
        surfaces.forEach((surface) => {
          surface.style.filter = '';
        });
        filters.forEach((filter) => filter.setAttribute('scale', '0'));
      };
    });
    return () => media.revert();
  }, [root]);
}

function GridProjectGallery({ projects }: { projects: ProjectCard[] }) {
  const root = useRef<HTMLDivElement>(null);
  useScrollWarp(root);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('.project-tile').forEach((tile) => {
          const window_ = tile.querySelector('.project-window');
          const inner = tile.querySelector('.project-warp-inner');
          const lane = Number(tile.dataset.lane);
          const entrance = gsap.timeline({ paused: true });
          entrance.fromTo(
            window_,
            { scale: 0.7, x: () => window.innerWidth * (lane ? -0.05 : 0.05), rotation: lane ? 2.86 : -2.86 },
            { scale: 1, x: 0, rotation: 0, duration: 2, ease: 'expo.out', clearProps: 'transform' },
            0
          );
          entrance.fromTo(inner, { scale: 1.07 }, { scale: 1, duration: 1.5, ease: 'expo.out', clearProps: 'transform' }, 0);
          ScrollTrigger.create({
            trigger: tile,
            start: 'top bottom',
            end: 'bottom top',
            onEnter: () => entrance.restart(),
            onEnterBack: () => entrance.restart(),
          });
        });
      }, root);
      return () => context.revert();
    });
    return () => media.revert();
  }, [projects]);

  return (
    <div ref={root} className="project-gallery">
      {projects.map((project, index) => (
        <GridProjectTile key={project.slug} project={project} index={index} />
      ))}
    </div>
  );
}

/**
 * ProjectGallery Component
 * Automatically renders Directoo-style stacked deck for featured projects (home page)
 * or grid gallery for full project directory.
 */
export default function ProjectGallery({ projects, mode }: ProjectGalleryProps) {
  const activeMode = mode ?? (projects.length <= 6 ? 'stacked' : 'grid');

  if (activeMode === 'stacked') {
    return <StackedProjectDeck projects={projects} />;
  }

  return <GridProjectGallery projects={projects} />;
}
