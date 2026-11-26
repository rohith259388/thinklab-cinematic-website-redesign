'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import * as THREE from 'three';
import type { ProjectCard } from './ProjectGallery';
import { useProjectTransition } from '@/components/transition/ProjectTransition';
import {
  CARD_VERT,
  CARD_FRAG,
  CAM_Z,
  BEND_DEPTH,
  CARD_PAD,
  CARD_RADIUS,
  bendRange,
  isProjectCover,
} from '@/components/transition/cardShader';

interface Item {
  el: HTMLElement;
  textEl: HTMLElement | null;
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  scale: number;
}

export default function ProjectBendGallery({
  projects,
  pageBg = '#f0f0e9',
  cardBg = '#ffffff',
}: {
  projects: ProjectCard[];
  pageBg?: string;
  cardBg?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hovered = useRef(-1);
  const [gl, setGl] = useState(false);
  const pt = useProjectTransition();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
    } catch {
      canvas.dataset.galleryReady = '1'; // flat DOM cards are ready immediately
      return; // WebGL fallback
    }
    setGl(true);

    // Tell the card ↔ hero transition when every logo is on the GPU, so the closing
    // animation never competes with texture decode/upload work.
    let pending = 0;
    const settle = () => {
      if (--pending <= 0) canvas.dataset.galleryReady = '1';
    };
    // Returning from a project (html[data-pt="back"]): load only the logos on screen once the
    // scroll position is restored; the rest wait until the closing animation is over.
    const returning = document.documentElement.dataset.pt === 'back';
    const deferred: { el: HTMLElement; load: () => void }[] = [];

    // clientWidth = the canvas's real CSS width (excludes a Windows/Linux scrollbar)
    let W = document.documentElement.clientWidth;
    let H = window.innerHeight;
    const camZ = CAM_Z;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      (2 * Math.atan(H / 2 / camZ) * 180) / Math.PI,
      W / H,
      100,
      5000,
    );
    camera.position.z = camZ;

    const geo = new THREE.PlaneGeometry(1, 1, 32, 32);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const bend = new THREE.Vector2(...bendRange(H));

    const items: Item[] = [];
    visualRefs.current.forEach((el, i) => {
      if (!el) return;
      const isCover = isProjectCover(projects[i]?.image, projects[i]?.slug);
      const mat = new THREE.ShaderMaterial({
        vertexShader: CARD_VERT,
        fragmentShader: CARD_FRAG,
        transparent: true,
        uniforms: {
          uTex: { value: null },
          uImg: { value: new THREE.Vector2(1, 1) },
          uMesh: { value: new THREE.Vector2(1, 1) },
          uScale: { value: 1 },
          uHasTex: { value: 0 },
          uRadius: { value: CARD_RADIUS },
          uBorder: { value: 1 },
          uCover: { value: isCover ? 1 : 0 },
          uScrim: { value: 0 },
          uAmt: { value: 1 },
          uIns: {
            value: isCover
              ? new THREE.Vector4(0, 0, 0, 0)
              : new THREE.Vector4(CARD_PAD, CARD_PAD, CARD_PAD, CARD_PAD),
          },
          uVel: { value: 0 },
          uTime: { value: 0 },
          uBend: { value: bend },
          uBg: { value: new THREE.Color(isCover ? '#120d21' : cardBg) },
          uFog: { value: new THREE.Color(pageBg) },
          uScrimColor: { value: new THREE.Color('#0a0714') },
        },
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      items.push({
        el,
        textEl: textRefs.current[i] || null,
        mesh,
        mat,
        scale: 1,
      });

      const imgUrl = projects[i]?.image;
      if (imgUrl) {
        const load = () => {
          pending++;
          loader.load(
            imgUrl,
            (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.anisotropy = 8;
              renderer.initTexture(tex); // upload as each arrives, not all at once on a later frame
              mat.uniforms.uTex.value = tex;
              mat.uniforms.uImg.value.set(tex.image.width, tex.image.height);
              mat.uniforms.uHasTex.value = 1;
              dirty = 2;
              settle();
            },
            undefined,
            settle,
          );
        };
        if (returning) deferred.push({ el, load });
        else load();
      }
    });
    renderer.compile(scene, camera); // compile the card shader now, not on the first frame
    if (pending === 0 && !returning) canvas.dataset.galleryReady = '1';

    const loadDeferred = (nearOnly: boolean) => {
      for (let i = deferred.length - 1; i >= 0; i--) {
        const r = deferred[i].el.getBoundingClientRect();
        if (!nearOnly || (r.bottom > -H * 0.25 && r.top < H * 1.25)) {
          deferred[i].load();
          deferred.splice(i, 1);
        }
      }
    };
    const onRestored = () => {
      loadDeferred(true);
      if (pending === 0) canvas.dataset.galleryReady = '1';
    };
    window.addEventListener('pt:restored', onRestored);
    if (returning && document.documentElement.dataset.ptRestored) onRestored();

    // While a page transition covers the screen, only redraw when something actually changed.
    let dirty = 2;
    let lastScroll = -1;

    const onResize = () => {
      dirty = 2;
      W = document.documentElement.clientWidth;
      H = window.innerHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.fov = (2 * Math.atan(H / 2 / camZ) * 180) / Math.PI;
      camera.updateProjectionMatrix();
      bend.set(...bendRange(H));
    };
    window.addEventListener('resize', onResize);

    let prevY = window.scrollY;
    let vel = 0;
    let raf = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (deferred.length && !document.documentElement.dataset.pt) loadDeferred(false);
      const t = clock.getElapsedTime();
      const dy = window.scrollY - prevY;
      prevY = window.scrollY;
      vel += ((dy / H) * 6 - vel) * 0.1;

      if (
        document.documentElement.dataset.pt &&
        window.scrollY === lastScroll &&
        dirty <= 0 &&
        Math.abs(vel) < 0.002
      )
        return;
      lastScroll = window.scrollY;
      dirty--;

      items.forEach((it, i) => {
        const r = it.el.getBoundingClientRect();
        const off = r.bottom < -300 || r.top > H + 300;
        it.mesh.visible = !off;
        if (off) return;

        // Position 3D white card plane exactly over DOM placeholder
        it.mesh.scale.set(r.width, r.height, 1);
        it.mesh.position.set(r.left + r.width / 2 - W / 2, -(r.top + r.height / 2 - H / 2), 0);

        const target = hovered.current === i ? 1.05 : 1;
        it.scale += (target - it.scale) * 0.1;
        const u = it.mat.uniforms;
        u.uScale.value = it.scale;
        u.uMesh.value.set(r.width, r.height);
        u.uVel.value = vel;
        u.uTime.value = t;

        // Project the DOM text with the exact same camera + bend as the WebGL card,
        // so it recedes toward the same vanishing point (viewport centre) in the same direction.
        // Glue the text to the card's projected bottom edge (same math as the vertex shader),
        // so it moves, shrinks and fades exactly with the card instead of drifting on its own.
        if (it.textEl) {
          const textTop = r.bottom + 16; // untransformed layout top (mt-4 below the card)
          const bx = r.left + r.width / 2 - W / 2;
          const by = H / 2 - r.bottom; // world y of the card's bottom edge
          const k = THREE.MathUtils.smoothstep(by, bend.x, bend.y);
          const ripple = Math.sin((bx - by) * 0.02 - t * 2.0) * 14.0 * Math.min(Math.abs(vel), 1.0);
          const z = -BEND_DEPTH * k + ripple;

          if (k > 0.001 || Math.abs(ripple) > 0.05) {
            const s = camZ / (camZ - z); // perspective scale at the card's bottom edge
            const projLeft = W / 2 + (r.left - W / 2) * s;
            const projBottom = H / 2 + (r.bottom - H / 2) * s;
            const dx = projLeft - r.left;
            const dy = projBottom + 16 * s - textTop;
            it.textEl.style.transformOrigin = '0 0';
            it.textEl.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${s})`;
            const fade = (1 - 0.85 * k) * (1 - THREE.MathUtils.smoothstep(k, 0.85, 1));
            it.textEl.style.opacity = `${Math.max(0, fade)}`;
          } else {
            it.textEl.style.transform = 'none';
            it.textEl.style.opacity = '1';
          }
        }
      });

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pt:restored', onRestored);
      items.forEach((it) => {
        it.mat.uniforms.uTex.value?.dispose();
        it.mat.dispose();
      });
      geo.dispose();
      renderer.dispose();
      delete canvas.dataset.galleryReady;
      setGl(false);
    };
  }, [projects, pageBg, cardBg]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
          display: gl ? 'block' : 'none',
        }}
      />
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-x-6 gap-y-14 px-5 py-10 md:grid-cols-2">
        {projects.map((p, i) => {
          const isCover = isProjectCover(p.image, p.slug);
          return (
          <Link
            key={p.slug}
            href={p.href}
            className="group block"
            onPointerEnter={() => {
              hovered.current = i;
              if (!p.archive) pt?.prefetch(p.href, p.image);
            }}
            onPointerLeave={() => (hovered.current = -1)}
            onClick={(e) => {
              const el = visualRefs.current[i];
              if (
                !pt ||
                !el ||
                p.archive ||
                e.metaKey ||
                e.ctrlKey ||
                e.shiftKey ||
                e.altKey ||
                e.button !== 0
              )
                return;
              e.preventDefault();
              pt.open(el, {
                slug: p.slug,
                href: p.href,
                image: p.image,
                bent: gl,
                cover: isCover,
              });
            }}
            aria-label={`${p.title} — view project`}
          >
            {/* Visual container: when gl is active, background is transparent so the 3D WebGL card is the only card surface */}
            <div
              ref={(el) => {
                visualRefs.current[i] = el;
              }}
              data-pt-card={p.slug}
              data-pt-cover={isCover ? '1' : undefined}
              className={`relative aspect-[820/430] w-full overflow-hidden rounded-3xl transition-colors duration-300 ${
                gl
                  ? 'bg-transparent'
                  : isCover
                    ? 'bg-[#120d21] shadow-[0_20px_45px_-12px_rgba(0,0,0,0.18)]'
                    : 'bg-white shadow-[0_20px_45px_-12px_rgba(0,0,0,0.08)]'
              }`}
            >
              {/* WebGL fallback */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt=""
                loading="lazy"
                className={
                  isCover
                    ? 'absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105'
                    : 'absolute inset-0 h-full w-full object-contain p-[18%]'
                }
                style={{ opacity: gl ? 0 : 1 }}
              />
            </div>

            {/* Content text container: follows 3D perspective bend backwards without detaching or shifting upward */}
            <div
              ref={(el) => {
                textRefs.current[i] = el;
              }}
              className="mt-4 flex items-end justify-between border-b border-black/20 pb-3 transition-[color] duration-300 will-change-transform"
            >
              <div>
                <h3 className="text-[26px] font-semibold leading-tight text-[#20211f] group-hover:text-black">
                  {p.title}
                </h3>
                <p className="text-[18px] leading-tight text-[#71736d] mt-1 line-clamp-1">{p.tags}</p>
              </div>
              <ArrowUpRight className="text-[#20211f] shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
            </div>
          </Link>
          );
        })}
      </div>
    </>
  );
}
