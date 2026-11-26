'use client';

/**
 * Shared-element transition between a project card and its detail hero.
 *
 * Forward: the clicked card itself opens to fill the viewport — drawn with the gallery's own
 * WebGL card shader, so it starts from exactly where and how the card sits (including its 3D
 * bend near the top of the screen) and straightens as it grows. The logo glides into its hero
 * position, the route changes underneath, and the layer dissolves over the identical hero.
 *
 * Back: the reverse — the layer covers the hero, the gallery is restored at the scroll position
 * the visitor left from, and the layer closes back into the card, re-bending as it lands.
 *
 * Smoothness on every OS: one eased progress value drives every property, nothing animates
 * layout, React route work only happens while the layer already covers the screen, and the
 * background scenes pause while a transition runs. Without WebGL (where the gallery also renders
 * flat cards) a DOM panel animated with clip-path + transform does the same job.
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type MouseEvent,
  type ReactNode,
} from 'react';
import type * as THREE_NS from 'three';
import { gsap } from '@/lib/gsap';
import {
  BEND_DEPTH,
  CAM_Z,
  CARD_FRAG,
  CARD_PAD,
  CARD_RADIUS,
  CARD_VERT,
  bendRange,
  isProjectCover,
} from './cardShader';

type OpenPayload = { slug: string; href: string; image?: string; bent?: boolean; cover?: boolean };
type Api = {
  open: (el: HTMLElement, p: OpenPayload) => void;
  back: () => void;
  prefetch: (href: string, image?: string) => void;
};
type Rec = OpenPayload & { scrollY: number; origin: string };
type Box = { x: number; y: number; w: number; h: number };
type Insets = { top: number; right: number; bottom: number; left: number };
type Logo = { src: string; aspect: number; tex: THREE_NS.Texture | null } | null;
/** Everything one morph needs. */
type Morph = { card: Box; logo: Logo; bent: boolean; logoScale: number; inset: Insets; radius: number; cover: boolean };
type GL = {
  THREE: typeof THREE_NS;
  renderer: THREE_NS.WebGLRenderer;
  scene: THREE_NS.Scene;
  camera: THREE_NS.PerspectiveCamera;
  mesh: THREE_NS.Mesh;
  mat: THREE_NS.ShaderMaterial;
  textures: Map<string, Promise<THREE_NS.Texture | null>>;
};
type Layer = { el: HTMLElement; paint: (m: Morph, t: number) => void };

const Ctx = createContext<Api | null>(null);
export const useProjectTransition = () => useContext(Ctx);

const GALLERY = '/projects';
const DURATION = 1;
const EASE = 'expo.inOut';
const PAGE_BG = '#f0f0e9'; // gallery page colour the bent cards fade into
const FOG_RGB = '240, 240, 233';
const CARD_INSET: Insets = { top: CARD_PAD, right: CARD_PAD, bottom: CARD_PAD, left: CARD_PAD };
const ZERO_INSET: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
// Must mirror .project-hero .ph-logo in globals.css
const heroInset = (cover?: boolean): Insets =>
  cover
    ? ZERO_INSET
    : window.innerWidth < 768
      ? { top: 0.16, right: 0.12, bottom: 0.52, left: 0.12 }
      : { top: 0.16, right: 0.3, bottom: 0.46, left: 0.3 };

// clientWidth excludes a classic (Windows/Linux) scrollbar, matching fixed/100%-wide boxes;
// on macOS/iOS overlay scrollbars it equals innerWidth. Keeps every frame identical across OSes.
const viewport = (): Box => ({
  x: 0,
  y: 0,
  w: document.documentElement.clientWidth,
  h: window.innerHeight,
});
const inset = (b: Box, i: Insets): Box => ({
  x: b.x + b.w * i.left,
  y: b.y + b.h * i.top,
  w: b.w * (1 - i.left - i.right),
  h: b.h * (1 - i.top - i.bottom),
});
/** The rect an `object-fit: contain` image of this aspect ratio occupies inside `b`. */
const contain = (b: Box, aspect: number): Box => {
  let w = b.w;
  let h = w / aspect;
  if (h > b.h) {
    h = b.h;
    w = h * aspect;
  }
  return { x: b.x + (b.w - w) / 2, y: b.y + (b.h - h) / 2, w, h };
};
/** The rect an `object-fit: cover` image of this aspect ratio occupies inside `b`. */
const coverRect = (b: Box, aspect: number): Box => {
  let w = b.w;
  let h = w / aspect;
  if (h < b.h) {
    h = b.h;
    w = h * aspect;
  }
  return { x: b.x + (b.w - w) / 2, y: b.y + (b.h - h) / 2, w, h };
};
const scaleBox = (b: Box, s: number): Box => ({
  x: b.x + (b.w * (1 - s)) / 2,
  y: b.y + (b.h * (1 - s)) / 2,
  w: b.w * s,
  h: b.h * s,
});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpInsets = (a: Insets, b: Insets, t: number): Insets => ({
  top: lerp(a.top, b.top, t),
  right: lerp(a.right, b.right, t),
  bottom: lerp(a.bottom, b.bottom, t),
  left: lerp(a.left, b.left, t),
});
/** Bend amount 0..1 of a point at this screen y — the vertex shader's smoothstep. */
const bendK = (screenY: number) => {
  const H = window.innerHeight;
  const [e0, e1] = bendRange(H);
  const x = Math.min(1, Math.max(0, (H / 2 - screenY - e0) / (e1 - e0)));
  return x * x * (3 - 2 * x);
};

/**
 * Where the card sits on screen and how its logo is framed. Cards drawn by the WebGL gallery use
 * the shader's own constants; DOM cards (e.g. the home page deck) mark their logo box with
 * [data-pt-logo] so the morph starts from exactly that frame and corner radius.
 */
function measureCard(el: HTMLElement): { card: Box; inset: Insets; radius: number } {
  const r = el.getBoundingClientRect();
  const card: Box = { x: r.left, y: r.top, w: r.width, h: r.height };
  if (el.dataset.ptCover === '1') return { card, inset: ZERO_INSET, radius: CARD_RADIUS };
  const logoEl = el.querySelector<HTMLElement>('[data-pt-logo]');
  if (!logoEl || !r.width || !r.height) return { card, inset: CARD_INSET, radius: CARD_RADIUS };
  const l = logoEl.getBoundingClientRect();
  const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius);
  return {
    card,
    inset: {
      top: (l.top - r.top) / r.height,
      right: (r.right - l.right) / r.width,
      bottom: (r.bottom - l.bottom) / r.height,
      left: (l.left - r.left) / r.width,
    },
    radius: Number.isFinite(radius) ? radius : CARD_RADIUS,
  };
}

const detailSlug = (path: string) => {
  const m = path.match(/^\/projects\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const show = (el: HTMLElement, opacity = 1) => gsap.set(el, { display: 'block', opacity });
const hide = (el: HTMLElement | null) => {
  if (el) el.style.display = 'none';
};

function waitFor<T>(get: () => T | null | undefined, timeout = 3000): Promise<T | null> {
  const start = performance.now();
  return new Promise((resolve) => {
    const loop = () => {
      const v = get();
      if (v) return resolve(v);
      if (performance.now() - start > timeout) return resolve(null);
      requestAnimationFrame(loop);
    };
    loop();
  });
}

/** Resolve once the browser produces a few consecutive on-time frames (max ~500ms). */
function steadyFrames(needed = 3, budget = 22, timeout = 500): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    let last = start;
    let good = 0;
    const loop = (now: number) => {
      good = now - last < budget ? good + 1 : 0;
      last = now;
      if (good >= needed || now - start > timeout) return resolve();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}

function scrollToY(y: number) {
  const lenis = window.__lenis;
  lenis?.start();
  lenis?.scrollTo(y, { immediate: true, force: true });
  window.scrollTo(0, y);
}

export default function ProjectTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const panel = useRef<HTMLDivElement>(null);
  const logoImg = useRef<HTMLImageElement>(null);
  const fog = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<GL | null>(null);
  const glInit = useRef<Promise<GL | null> | null>(null);
  const busy = useRef(false);
  const rec = useRef<Rec | null>(null);
  const prefetched = useRef(new Set<string>());

  /* ─────────────── WebGL layer (lazy; three.js is already cached by the gallery) ─────────────── */
  const ensureGL = useCallback((): Promise<GL | null> => {
    if (glInit.current) return glInit.current;
    glInit.current = (async () => {
      const el = canvas.current;
      if (!el) return null;
      try {
        const THREE = await import('three');
        const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 100, 5000);
        camera.position.z = CAM_Z;
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
            uCover: { value: 0 },
            uScrim: { value: 0 },
            uAmt: { value: 1 },
            uIns: { value: new THREE.Vector4(CARD_PAD, CARD_PAD, CARD_PAD, CARD_PAD) },
            uVel: { value: 0 },
            uTime: { value: 0 },
            uBend: { value: new THREE.Vector2(...bendRange(window.innerHeight)) },
            uBg: { value: new THREE.Color('#ffffff') },
            uFog: { value: new THREE.Color(PAGE_BG) },
            uScrimColor: { value: new THREE.Color('#0a0714') },
          },
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 32, 32), mat);
        scene.add(mesh);
        renderer.compile(scene, camera); // no shader-compile hitch on the first animated frame
        glRef.current = { THREE, renderer, scene, camera, mesh, mat, textures: new Map() };
        return glRef.current;
      } catch {
        return null; // no WebGL → DOM panel fallback
      }
    })();
    return glInit.current;
  }, []);

  const loadTexture = useCallback((gl: GL, src: string) => {
    let p = gl.textures.get(src);
    if (!p) {
      p = new Promise((resolve) => {
        new gl.THREE.TextureLoader().setCrossOrigin('anonymous').load(
          src,
          (tex) => {
            tex.colorSpace = gl.THREE.SRGBColorSpace;
            tex.anisotropy = 8;
            gl.renderer.initTexture(tex); // upload now, not on the first animated frame
            resolve(tex);
          },
          undefined,
          () => resolve(null),
        );
      });
      gl.textures.set(src, p);
    }
    return p;
  }, []);

  /** Resolve the logo (and its GL texture when available) before anything moves. */
  const prepareLogo = useCallback(
    async (src: string | undefined, gl: GL | null): Promise<Logo> => {
      if (!src) return null;
      const img = logoImg.current;
      if (img && img.getAttribute('src') !== src) img.src = src;
      const tex = gl ? await loadTexture(gl, src) : null;
      if (img) {
        try {
          await img.decode();
        } catch {
          /* broken image — animate without it */
        }
        img.style.display = img.naturalWidth ? 'block' : 'none';
      }
      const texImg = tex?.image as { width: number; height: number } | undefined;
      const w = texImg?.width || img?.naturalWidth || 0;
      const h = texImg?.height || img?.naturalHeight || 0;
      return w && h ? { src, aspect: w / h, tex } : null;
    },
    [loadTexture],
  );

  const prefetch = useCallback(
    (href: string, image?: string) => {
      if (!prefetched.current.has(href)) {
        prefetched.current.add(href);
        router.prefetch(href);
      }
      // Warm the WebGL layer + texture on hover so the click starts instantly.
      if (!reduced()) {
        void ensureGL().then((gl) => {
          if (gl && image) void loadTexture(gl, image);
        });
      }
    },
    [router, ensureGL, loadTexture],
  );

  /* ─────────────── painting one frame (t = 0 card … t = 1 hero) ─────────────── */
  const paintGL = useCallback((gl: GL, m: Morph, t: number) => {
    const { renderer, camera, mesh, mat } = gl;
    const { w: W, h: H } = viewport();
    const size = renderer.getSize(new gl.THREE.Vector2());
    if (size.x !== W || size.y !== H) {
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.fov = (2 * Math.atan(H / 2 / CAM_Z) * 180) / Math.PI;
      camera.updateProjectionMatrix();
      (mat.uniforms.uBend.value as THREE_NS.Vector2).set(...bendRange(H));
    }
    const x = lerp(m.card.x, 0, t);
    const y = lerp(m.card.y, 0, t);
    const w = lerp(m.card.w, W, t);
    const h = lerp(m.card.h, H, t);
    mesh.scale.set(w, h, 1);
    mesh.position.set(x + w / 2 - W / 2, -(y + h / 2 - H / 2), 0);
    const u = mat.uniforms;
    u.uAmt.value = m.bent ? 1 - t : 0;
    u.uRadius.value = lerp(m.radius, 0, t);
    u.uBorder.value = 1 - t;
    u.uCover.value = m.cover ? 1 : 0;
    u.uScrim.value = m.cover ? t : 0;
    (u.uBg.value as THREE_NS.Color).set(m.cover ? '#120d21' : '#ffffff');
    u.uScale.value = lerp(m.logoScale, 1, t);
    (u.uMesh.value as THREE_NS.Vector2).set(w, h);
    const ins = lerpInsets(m.inset, heroInset(m.cover), t);
    (u.uIns.value as THREE_NS.Vector4).set(ins.top, ins.right, ins.bottom, ins.left);
    if (m.logo?.tex) {
      u.uTex.value = m.logo.tex;
      const img = m.logo.tex.image as { width: number; height: number };
      (u.uImg.value as THREE_NS.Vector2).set(img.width, img.height);
      u.uHasTex.value = 1;
    } else {
      u.uHasTex.value = 0;
    }
    renderer.render(gl.scene, camera);
  }, []);

  /** DOM fallback / instant cover: clip-path for the shape, transform for the artwork. */
  const paintDOM = useCallback((m: Morph, t: number) => {
    const node = panel.current;
    const img = logoImg.current;
    if (!node) return;
    node.style.background = m.cover ? '#0a0714' : '#ffffff';
    const { card } = m;
    const vp = viewport();
    const x = lerp(card.x, 0, t);
    const y = lerp(card.y, 0, t);
    const w = lerp(card.w, vp.w, t);
    const h = lerp(card.h, vp.h, t);
    const r = lerp(m.radius, 0, t);
    const clip = `inset(${y}px ${vp.w - x - w}px ${vp.h - y - h}px ${x}px round ${r}px)`;
    node.style.clipPath = clip;
    node.style.setProperty('-webkit-clip-path', clip);

    // Approximate bend (only used if WebGL failed here after the gallery bent its cards).
    const u = 1 - t;
    const kTop = m.bent ? bendK(card.y) : 0;
    const kBot = m.bent ? bendK(card.y + card.h) : 0;
    const zTop = -BEND_DEPTH * kTop * u;
    const zBot = -BEND_DEPTH * kBot * u;
    if (Math.abs(zTop) + Math.abs(zBot) > 0.05) {
      const slope = (zBot - zTop) / Math.max(1, h);
      const z0 = zTop - slope * (y - vp.h / 2);
      node.style.transformOrigin = `${vp.w / 2}px ${vp.h / 2}px`;
      node.style.transform = `perspective(${CAM_Z}px) matrix3d(1,0,0,0, 0,1,${slope},0, 0,0,1,0, 0,0,${z0},1)`;
    } else {
      node.style.transform = 'none';
    }
    if (fog.current) {
      const aTop = 0.85 * kTop * u;
      const aBot = 0.85 * kBot * u;
      if (m.cover && t > 0.002) {
        fog.current.style.background = `linear-gradient(180deg, rgba(10,7,20,${(0.45 * t).toFixed(3)}) 0%, rgba(10,7,20,${(0.12 * t).toFixed(3)}) 38%, rgba(10,7,20,${(0.72 * t).toFixed(3)}) 72%, rgba(10,7,20,${(0.92 * t).toFixed(3)}) 100%)`;
      } else {
        fog.current.style.background =
          aTop + aBot > 0.002
            ? `linear-gradient(to bottom, rgba(${FOG_RGB}, ${aTop}) ${y}px, rgba(${FOG_RGB}, ${aBot}) ${y + h}px)`
            : 'none';
      }
    }

    if (img && m.logo) {
      const fit = m.cover ? coverRect : contain;
      const from = scaleBox(fit(inset(card, m.inset), m.logo.aspect), m.logoScale);
      const to = fit(inset(vp, heroInset(m.cover)), m.logo.aspect);
      // Laid out once at hero size and only ever scaled down → crisp at rest.
      img.style.objectFit = m.cover ? 'cover' : 'contain';
      img.style.width = `${to.w}px`;
      img.style.height = `${to.h}px`;
      const lx = lerp(from.x, to.x, t);
      const ly = lerp(from.y, to.y, t);
      const s = lerp(from.w, to.w, t) / to.w;
      img.style.transform = `translate3d(${lx}px, ${ly}px, 0) scale(${s})`;
    }
  }, []);

  const layerFor = useCallback(
    (gl: GL | null): Layer =>
      gl && canvas.current
        ? { el: canvas.current, paint: (m, t) => paintGL(gl, m, t) }
        : { el: panel.current!, paint: paintDOM },
    [paintGL, paintDOM],
  );

  const finish = useCallback(() => {
    hide(panel.current);
    hide(canvas.current);
    delete document.documentElement.dataset.pt;
    delete document.documentElement.dataset.ptRestored;
    window.__lenis?.start();
    busy.current = false;
  }, []);

  /** Tween t with the shared ease; resolves when done. */
  const morph = useCallback(
    (layer: Layer, m: Morph, from: number, to: number) =>
      new Promise<void>((resolve) => {
        const state = { t: from };
        layer.paint(m, from);
        gsap.to(state, {
          t: to,
          duration: DURATION,
          ease: EASE,
          onUpdate: () => layer.paint(m, state.t),
          onComplete: () => resolve(),
        });
      }),
    [],
  );

  /* ─────────────── forward: card → hero ─────────────── */
  const open = useCallback(
    async (el: HTMLElement, p: OpenPayload) => {
      if (!panel.current || busy.current || reduced()) {
        router.push(p.href);
        return;
      }
      busy.current = true;
      rec.current = { ...p, scrollY: window.scrollY, origin: pathRef.current };
      document.documentElement.dataset.pt = 'forward';
      prefetch(p.href);
      window.__lenis?.stop();

      const isCover = Boolean(p.cover ?? (el.dataset.ptCover === '1' || isProjectCover(p.image, p.slug)));
      const shape = measureCard(el);
      const gl = await ensureGL();
      const logo = await prepareLogo(p.image, gl);
      // The gallery enlarges a hovered card's image to 1.05 — start from exactly what's on screen.
      const hovered = el.closest('a')?.matches(':hover') ?? false;
      const m: Morph = {
        ...shape,
        inset: isCover ? ZERO_INSET : shape.inset,
        logo,
        bent: Boolean(p.bent),
        logoScale: p.bent !== undefined && hovered ? 1.05 : 1,
        cover: isCover,
      };
      const layer = layerFor(gl);
      layer.paint(m, 0);
      show(layer.el);

      // Start the route at 85% of the tween: expo.inOut has eased to 99.6% by then, so the layer
      // covers the screen and is all but still — any frame React's commit costs falls where
      // nothing visibly moves — while the (prefetched) page still gets a head start.
      gsap.delayedCall(DURATION * 0.85, () => router.push(p.href, { scroll: false }));
      await morph(layer, m, 0, 1);

      const hero = await waitFor(() => {
        const h = document.querySelector<HTMLElement>(`[data-project-hero="${CSS.escape(p.slug)}"]`);
        const img = h?.querySelector('img');
        return h && (!img || img.complete) ? h : null;
      }, 5000);

      scrollToY(0);
      await nextFrame();
      await nextFrame();
      const copy = hero?.querySelectorAll<HTMLElement>('[data-pt-copy] > *');
      if (copy?.length) {
        gsap.fromTo(
          copy,
          { y: 42, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.15, force3D: true },
        );
      }
      gsap.to(layer.el, { opacity: 0, duration: 0.45, ease: 'power1.out', onComplete: finish });
    },
    [router, finish, prefetch, ensureGL, prepareLogo, layerFor, morph],
  );

  /* ─────────────── back: hero → card ─────────────── */
  const reverse = useCallback(
    /** `dest` is where we're returning to: the card's origin page, or the gallery. */
    async (viaPopstate: boolean, dest?: string) => {
      const node = panel.current;
      const slug = detailSlug(pathRef.current);
      if (!node || busy.current || !slug || reduced()) return false;
      busy.current = true;
      document.documentElement.dataset.pt = 'back';

      const hero = document.querySelector<HTMLElement>('[data-project-hero]');
      const record = rec.current?.slug === slug ? rec.current : null;
      const to = dest ?? record?.origin ?? GALLERY;
      if (!record) prefetch(GALLERY);
      const src = hero?.querySelector('img')?.getAttribute('src') || record?.image;
      const isCover = hero?.dataset.projectCover === '1' || Boolean(record?.cover) || isProjectCover(src, slug);

      // 1) Cover at once with the DOM panel showing the hero's exact resting frame.
      const cover = await prepareLogo(src, null);
      paintDOM(
        {
          card: viewport(),
          logo: cover,
          bent: false,
          logoScale: 1,
          inset: isCover ? ZERO_INSET : CARD_INSET,
          radius: 0,
          cover: isCover,
        },
        1,
      );
      if (window.scrollY > 4) {
        show(node, 0);
        await gsap.to(node, { opacity: 1, duration: viaPopstate ? 0.12 : 0.2, ease: 'power1.out' });
      } else {
        show(node);
      }

      window.__lenis?.stop();
      if (!viaPopstate) {
        if (record) router.back();
        else router.push(GALLERY, { scroll: false });
      }

      // 2) Meanwhile get the WebGL layer + texture ready.
      const gl = await ensureGL();
      const logo = gl ? await prepareLogo(src, gl) : cover;

      const cardEl = await waitFor(
        () =>
          pathRef.current === to
            ? document.querySelector<HTMLElement>(`[data-pt-card="${CSS.escape(slug)}"]`)
            : null,
        5000,
      );
      if (!cardEl) {
        gsap.to(node, { opacity: 0, duration: 0.4, onComplete: finish });
        rec.current = null;
        return true;
      }

      // 3) Restore the gallery exactly where the visitor left it (or centre the card).
      const target = Math.max(
        0,
        record
          ? record.scrollY
          : cardEl.getBoundingClientRect().top + window.scrollY - (window.innerHeight - cardEl.offsetHeight) / 2,
      );
      scrollToY(target);
      await nextFrame();
      scrollToY(target); // re-apply in case the router restored scroll late
      window.__lenis?.stop();

      // 4) Hold the (static) cover until the on-screen logos are on the GPU and the main thread
      //    is quiet — otherwise the closing animation competes with page start-up work and
      //    stutters, especially on slower Windows/Android hardware.
      document.documentElement.dataset.ptRestored = '1'; // for a gallery that mounts after this
      window.dispatchEvent(new Event('pt:restored'));
      // Cards drawn by the WebGL bend gallery (Projects page, home page) are transparent DOM boxes.
      const bent = cardEl.classList.contains('bg-transparent');
      if (bent) await waitFor(() => document.querySelector('canvas[data-gallery-ready]'), 1200);
      await nextFrame(); // let the WebGL gallery draw its cards at the restored position
      await steadyFrames();
      if (to !== GALLERY) {
        // Pages like home keep mounting lazy sections for a moment; land on the exact spot again.
        scrollToY(target);
        window.__lenis?.stop();
        await nextFrame();
      }

      // 5) Hand the cover to the morph layer (identical frame), then close into the card.
      const measured = measureCard(cardEl);
      const cardCover = cardEl.dataset.ptCover === '1' || isCover;
      const m: Morph = {
        ...measured,
        inset: cardCover ? ZERO_INSET : measured.inset,
        logo,
        bent,
        logoScale: 1,
        cover: cardCover,
      };
      const layer = layerFor(gl);
      if (layer.el !== node) {
        layer.paint(m, 1);
        show(layer.el);
        hide(node);
      }
      await morph(layer, m, 1, 0);
      rec.current = null;
      gsap.to(layer.el, { opacity: 0, duration: 0.35, ease: 'power1.out', onComplete: finish });
      return true;
    },
    [router, finish, prefetch, ensureGL, prepareLogo, paintDOM, layerFor, morph],
  );

  const back = useCallback(() => {
    reverse(false).then((handled) => {
      if (!handled) router.push(GALLERY);
    });
  }, [reverse, router]);

  // Browser back button: detail → gallery
  useEffect(() => {
    const onPop = () => {
      const to = location.pathname;
      if (!detailSlug(pathRef.current)) return;
      if (to === GALLERY || to === rec.current?.origin) void reverse(true, to);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [reverse]);

  useEffect(() => {
    pathRef.current = pathname;
    // Forget the origin card once the visitor wanders somewhere unrelated.
    const r = rec.current;
    if (r && !busy.current && pathname !== r.href && pathname !== r.origin) rec.current = null;
  }, [pathname]);

  useEffect(
    () => () => {
      const gl = glRef.current;
      if (!gl) return;
      gl.textures.forEach((p) => p.then((t) => t?.dispose()));
      gl.mat.dispose();
      gl.mesh.geometry.dispose();
      gl.renderer.dispose();
    },
    [],
  );

  const api = useMemo<Api>(() => ({ open, back, prefetch }), [open, back, prefetch]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <canvas
        ref={canvas}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'none',
          zIndex: 70, // under the nav (80) and cursor (95)
          pointerEvents: 'auto', // swallow clicks while a transition is in flight
          willChange: 'opacity',
        }}
      />
      <div
        ref={panel}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'none',
          zIndex: 70,
          overflow: 'hidden',
          background: '#ffffff',
          pointerEvents: 'auto',
          willChange: 'clip-path, transform, opacity',
          contain: 'strict',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={logoImg}
          alt=""
          decoding="async"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            objectFit: 'contain',
            transformOrigin: '0 0',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        />
        <div ref={fog} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </Ctx.Provider>
  );
}

/** A link back to the gallery that plays the reverse transition when available. */
export function GalleryBackLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const pt = useProjectTransition();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!pt || href !== GALLERY || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    pt.back();
  };
  return (
    <Link href={href} className={className} onClick={onClick} onPointerEnter={() => pt?.prefetch(href)}>
      {children}
    </Link>
  );
}
