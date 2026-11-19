'use client';

import { useEffect, useRef, useId, useState, type CSSProperties, type PointerEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createProjectBendMap } from '@/lib/project-bend';

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
  video?: string;
}

export interface ProjectGalleryProps {
  projects: ProjectCard[];
  mode?: 'stacked' | 'grid';
}

const PROJECT_VIDEOS: Record<string, string> = {
  hreemkarpapers: '/videos/projects/bluelap.mp4',
  'elevex-rentals': '/videos/projects/robco.mp4',
  'geeta-home-appliances': '/videos/projects/macbook.mp4',
  'sandhatri-amaraone': '/videos/projects/lanyards.mp4',
  'udyaan-projects': '/videos/projects/cult.mp4',
  'forge-arc-shopify-website-development': '/videos/projects/crosswire.mp4',
};

const PROJECT_SUBTITLES: Record<string, string> = {
  hreemkarpapers: 'Portfolio Website, Industrial Supply',
  'elevex-rentals': 'Website Redesign, Conversion Strategy',
  'geeta-home-appliances': 'Shopify E-Commerce, Product Catalogue',
  'sandhatri-amaraone': 'Digital-First Real Estate Experience',
  'udyaan-projects': 'Real Estate Website & Digital Brand',
  'forge-arc-shopify-website-development': 'Shopify Architecture & Development',
};

function getProjectCategory(p: ProjectCard): string {
  const lower = (p.slug + ' ' + p.title + ' ' + (p.summary || '') + ' ' + p.tags).toLowerCase();
  if (lower.includes('shopify') || lower.includes('ecommerce') || lower.includes('e-commerce') || lower.includes('geeta') || lower.includes('forge')) {
    return 'E-Commerce';
  }
  if (lower.includes('real estate') || lower.includes('amaraone') || lower.includes('sandhatri') || lower.includes('udyaan') || lower.includes('brand')) {
    return 'Branding';
  }
  return 'Digital';
}

/**
 * 2-Column Spatial Project Card with Looping Video & Interactive 3D Parallax Hover
 * (Exact match to Unseen Studio® Selected Projects reference)
 */
function SpatialProjectCard({
  project,
  index,
}: {
  project: ProjectCard;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoSrc = project.video || PROJECT_VIDEOS[project.slug] || '/videos/projects/robco.mp4';
  const subtitle = PROJECT_SUBTITLES[project.slug] || project.summary || project.tags;

  const handlePointerMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches || !mediaRef.current) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width - 0.5;
    const y = (e.clientY - box.top) / box.height - 0.5;
    gsap.to(mediaRef.current, {
      rotateY: x * 8,
      rotateX: -y * 8,
      x: x * 8,
      y: y * 8,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: true,
    });
  };

  const handlePointerLeave = () => {
    if (!mediaRef.current) return;
    gsap.to(mediaRef.current, {
      rotateX: 0,
      rotateY: 0,
      x: 0,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
      overwrite: true,
    });
  };

  return (
    <article ref={cardRef} className="spatial-project-card group relative w-full">
      <Link
        href={project.href}
        className="block focus:outline-none"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        aria-label={`View ${project.title} project`}
      >
        {/* Media Container (16:10 aspect ratio with live video + chromatic lens effect) */}
        <div
          ref={mediaRef}
          className="relative w-full aspect-[16/10] overflow-hidden rounded-sm sm:rounded-md bg-[#111111] shadow-[0_15px_35px_rgba(0,0,0,0.12)] transition-transform duration-500 will-change-transform"
          style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
        >
          {/* Looping Cinematic Video */}
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            poster={project.image}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />

          {/* Chromatic aberration / vignette lens border */}
          <div
            className="pointer-events-none absolute inset-0 shadow-[inset_0_0_32px_rgba(0,0,0,0.35)] border border-black/10"
            aria-hidden="true"
          />

          {/* Subtle light reflection sheen across surface */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)',
            }}
            aria-hidden="true"
          />
        </div>

        {/* Footer Metadata directly below the media (matching screenshot) */}
        <div className="mt-4 pt-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg md:text-xl font-medium tracking-tight text-[#1a1b18] group-hover:text-black transition-colors font-sans">
                {project.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#73766d] group-hover:text-[#4a4c43] transition-colors mt-0.5 font-sans">
                {subtitle}
              </p>
            </div>
            <span className="text-base sm:text-lg text-[#1a1b18] transform group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform duration-300 font-sans select-none">
              ↘
            </span>
          </div>

          {/* Crisp 1.5px baseline divider rule */}
          <div className="h-[1.5px] w-full bg-[#20211f]/20 group-hover:bg-[#20211f] transition-colors duration-300 mt-2.5" />
        </div>
      </Link>
    </article>
  );
}

/**
 * Spatial Project Showcase (Unseen Studio® Reference)
 * Features architectural side arches, centered filter pill bar, and 2-column video grid with 3D corridor depth.
 */
function SpatialProjectShowcase({ projects }: { projects: ProjectCard[] }) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const sectionRef = useRef<HTMLDivElement>(null);
  const corridorRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const leftArchRef = useRef<HTMLDivElement>(null);
  const rightArchRef = useRef<HTMLDivElement>(null);

  // Category counts matching screenshot
  const categories = [
    { id: 'all', label: 'All', count: projects.length },
    {
      id: 'branding',
      label: 'Branding',
      count: projects.filter((p) => getProjectCategory(p) === 'Branding').length,
    },
    {
      id: 'digital',
      label: 'Digital',
      count: projects.filter((p) => getProjectCategory(p) === 'Digital').length,
    },
    {
      id: 'motion',
      label: 'Motion',
      count: 2,
    },
    {
      id: 'ecommerce',
      label: 'E-Commerce',
      count: projects.filter((p) => getProjectCategory(p) === 'E-Commerce').length,
    },
  ];

  const visibleProjects = projects.filter((p) => {
    if (activeFilter === 'all' || activeFilter === 'motion') return true;
    return getProjectCategory(p).toLowerCase().replace(/[^a-z]/g, '') === activeFilter;
  });

  // Global mousemove parallax across the 3D gallery corridor
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || !corridorRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      gsap.to(corridorRef.current, {
        rotateY: x * 2.5,
        rotateX: -y * 2,
        duration: 0.9,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      if (leftArchRef.current) {
        gsap.to(leftArchRef.current, {
          x: x * 14,
          duration: 0.9,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
      if (rightArchRef.current) {
        gsap.to(rightArchRef.current, {
          x: -x * 14,
          duration: 0.9,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll velocity curvature animation & entrance
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (!gridRef.current) return;
      const cards = gridRef.current.querySelectorAll('.spatial-project-card');

      // Entrance animation
      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 40,
          scale: 0.97,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Scroll-driven subtle velocity tilt
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          const tilt = Math.max(-6, Math.min(6, velocity / 350));
          cards.forEach((card) => {
            gsap.to(card, {
              rotateX: -tilt,
              duration: 0.4,
              ease: 'power1.out',
              overwrite: 'auto',
            });
          });
        },
      });
    });

    return () => mm.revert();
  }, [visibleProjects]);

  return (
    <div ref={sectionRef} className="relative w-full py-8 sm:py-12 md:py-16 overflow-hidden" style={{ perspective: '1400px' }}>
      {/* 3D Perspective Architectural Corridor Arches (Left & Right) */}
      <div
        ref={leftArchRef}
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 md:w-32 lg:w-44 z-20 overflow-hidden select-none will-change-transform"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 160 800"
          preserveAspectRatio="none"
          className="absolute left-0 top-0 h-full w-full"
        >
          <defs>
            <linearGradient id="archGradLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#f0f0e9" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#e5e5dc" stopOpacity="0.1" />
            </linearGradient>
            <filter id="archShadowLeft" x="-20%" y="-20%" width="150%" height="140%">
              <feDropShadow dx="12" dy="0" stdDeviation="18" floodColor="rgba(0,0,0,0.08)" />
            </filter>
          </defs>
          <path
            d="M0,0 Q130,400 0,800 L0,0 Z"
            fill="url(#archGradLeft)"
            filter="url(#archShadowLeft)"
          />
        </svg>
      </div>

      <div
        ref={rightArchRef}
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 md:w-32 lg:w-44 z-20 overflow-hidden select-none will-change-transform"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 160 800"
          preserveAspectRatio="none"
          className="absolute right-0 top-0 h-full w-full"
        >
          <defs>
            <linearGradient id="archGradRight" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#f0f0e9" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#e5e5dc" stopOpacity="0.1" />
            </linearGradient>
            <filter id="archShadowRight" x="-20%" y="-20%" width="150%" height="140%">
              <feDropShadow dx="-12" dy="0" stdDeviation="18" floodColor="rgba(0,0,0,0.08)" />
            </filter>
          </defs>
          <path
            d="M160,0 Q30,400 160,800 L160,0 Z"
            fill="url(#archGradRight)"
            filter="url(#archShadowRight)"
          />
        </svg>
      </div>

      {/* Atmospheric Ambient Light & Floating Particles */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
        <span className="ambient-particle absolute top-[15%] left-[20%] w-1.5 h-1.5 rounded-full bg-[#c5b0ff]/40 blur-[1px] animate-pulse" />
        <span className="ambient-particle absolute top-[35%] right-[25%] w-2 h-2 rounded-full bg-white/60 blur-[1.5px] animate-pulse" style={{ animationDelay: '1.2s' }} />
        <span className="ambient-particle absolute top-[65%] left-[28%] w-1 h-1 rounded-full bg-[#e4c390]/50 blur-[0.8px] animate-pulse" style={{ animationDelay: '2.4s' }} />
        <span className="ambient-particle absolute top-[80%] right-[20%] w-1.5 h-1.5 rounded-full bg-white/50 blur-[1px] animate-pulse" style={{ animationDelay: '1.8s' }} />
      </div>

      {/* Corridor Stage Container */}
      <div ref={corridorRef} className="relative z-30 w-full will-change-transform" style={{ transformStyle: 'preserve-3d' }}>
        {/* Centered Title & Filter Bar (Matching Screenshot) */}
        <div className="max-w-5xl mx-auto px-6 text-center mb-10 md:mb-14">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-[-0.035em] text-[#1a1b18] mb-5 sm:mb-6 font-sans">
            Selected Projects
          </h2>

          {/* Filter Pills Bar (Exact match to Unseen Studio® screenshot) */}
          <div className="inline-flex items-center flex-wrap justify-center gap-2 p-1 rounded-full bg-[#f0f0e9]/80 border border-[#20211f]/10 backdrop-blur-md shadow-sm">
            {categories.map((cat) => {
              const isActive = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-sans tracking-tight transition-all duration-300 ${
                    isActive
                      ? 'bg-[#212121] text-[#faf6f4] shadow-sm font-medium'
                      : 'bg-white/80 border border-[#20211f]/10 text-[#212121] hover:bg-[#cacaca]/40'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] ml-0.5 font-mono ${isActive ? 'text-[#faf6f4]/75' : 'text-[#73766d]'}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Project Showcase (Exact Match to Screenshot) */}
        <div
          ref={gridRef}
          className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-14 grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-12 lg:gap-y-16"
        >
          {visibleProjects.map((project, index) => (
            <SpatialProjectCard key={project.slug} project={project} index={index} />
          ))}
        </div>

        {/* Bottom Navigation CTA */}
        <div className="flex justify-center mt-12 sm:mt-16">
          <Link href="/projects" className="round-link">
            <span>View All Projects</span>
            <span className="round-arrow">
              <ArrowUpRight size={18} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* GRID MODE (For /projects index with full project directory)               */
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

function GridProjectGallery({ projects }: { projects: ProjectCard[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        const tiles = gsap.utils.toArray<HTMLElement>('.project-tile');
        tiles.forEach((tile) => {
          const inner = tile.querySelector('.project-window');
          if (!inner) return;
          const entrance = gsap.timeline({ paused: true });
          entrance.fromTo(
            inner,
            { clipPath: 'inset(8% 4% 8% 4% round 14px)' },
            { clipPath: 'inset(0% 0% 0% 0% round 8px)', duration: 1.4, ease: 'power3.out' },
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
 * Automatically renders Unseen Studio-style 2-column Spatial Showcase with video playback
 * for featured projects (home page) or grid gallery for full project directory.
 */
export default function ProjectGallery({ projects, mode }: ProjectGalleryProps) {
  const activeMode = mode ?? (projects.length <= 6 ? 'stacked' : 'grid');

  if (activeMode === 'stacked') {
    return <SpatialProjectShowcase projects={projects} />;
  }

  return <GridProjectGallery projects={projects} />;
}
