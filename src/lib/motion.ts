import * as THREE from 'three';

/**
 * The Living Idea — global motion state.
 * A single mutable store read by the WebGL organism every frame.
 * React never re-renders for animation; everything flows through here.
 */

export type PageKey = 'home' | 'about' | 'services' | 'projects' | 'blog' | 'contact';

export interface SceneState {
  /** Particle formation stage 0..4 (bulb → rise → scatter → blueprint → ecosystem) */
  stage: number;
  /** Bulb melt amount 0..1 */
  melt: number;
  /** Bulb visibility 0..1 */
  bulb: number;
  /** Architectural lattice edges opacity 0..1 */
  lattice: number;
  /** Energy flow / pulse intensity 0..1 */
  flow: number;
  /** Lighting warmth: 0 = near black, 1 = warm architectural illumination */
  warmth: number;
  /** Dimming applied while content scrolls over the scene */
  dim: number;
  camZ: number;
  camY: number;
  /** Structure rotation speed */
  spin: number;
}

const base: SceneState = {
  stage: 0,
  melt: 0.04,
  bulb: 1,
  lattice: 0,
  flow: 0.12,
  warmth: 0.04,
  dim: 0,
  camZ: 6.4,
  camY: 0.05,
  spin: 0.06,
};

export const motion = {
  page: 'home' as PageKey,
  current: { ...base } as SceneState,
  target: { ...base } as SceneState,
  /** raw pointer -1..1 (immediate) and eased values written by the canvas */
  pointer: { tx: 0, ty: 0, x: 0, y: 0 },
  /** pointer kinetic energy 0..1 — drives glow intensification */
  energy: 0,
  scroll: 0,
  /** true once the preloader has ignited the scene */
  ready: false,
  /** 0..1 through the preloader reveal */
  intro: 0,
  reduced: false,
};

/** Shared shader uniforms — imported directly by materials. */
export const U = {
  uTime: { value: 0 },
  uStage: { value: 0 },
  uMelt: { value: 0 },
  uBulb: { value: 1 },
  uLattice: { value: 0 },
  uFlow: { value: 0 },
  uWarm: { value: 0 },
  uDim: { value: 0 },
  uIntro: { value: 0 },
  uEnergy: { value: 0 },
  uPointer: { value: new THREE.Vector2(0, 0) },
  uBulbOffset: { value: new THREE.Vector3(0, 0, 0) },
  uBulbScale: { value: 1 },
  uPixelRatio: { value: 1 },
};

/* ------------------------------------------------------------------ */
/* Home journey keyframes — the bulb's evolution across the homepage. */
/* ------------------------------------------------------------------ */

export interface HomeKey extends SceneState {
  at: number; // journey progress 0..1
}

export const HOME_KEYS: HomeKey[] = [
  // SCENE 01 — The First Spark: darkness, a single breathing bulb.
  { at: 0.0, ...base },
  // SCROLL 01 — Reverse-gravity melt: liquid rises upward.
  { at: 0.2, stage: 0.55, melt: 0.75, bulb: 1, lattice: 0, flow: 0.25, warmth: 0.08, dim: 0, camZ: 5.6, camY: 0.4, spin: 0.06 },
  // SCROLL 02 — Liquid separates into thousands of luminous particles.
  { at: 0.45, stage: 2.0, melt: 1, bulb: 0.35, lattice: 0.18, flow: 0.45, warmth: 0.14, dim: 0, camZ: 7.0, camY: 0.1, spin: 0.08 },
  // SCROLL 03 — Particles organise into architectural wireframes.
  { at: 0.68, stage: 3.0, melt: 1, bulb: 0, lattice: 1, flow: 0.6, warmth: 0.3, dim: 0, camZ: 7.8, camY: 0.25, spin: 0.14 },
  // SCROLL 04 — The structure becomes ThinkLab: a living business ecosystem.
  { at: 0.9, stage: 4.0, melt: 1, bulb: 0, lattice: 1, flow: 1, warmth: 0.55, dim: 0, camZ: 8.6, camY: -0.1, spin: 0.22 },
  // Content takes over — the organism recedes but stays alive behind it.
  { at: 1.0, stage: 4.0, melt: 1, bulb: 0, lattice: 1, flow: 0.85, warmth: 0.5, dim: 0.78, camZ: 9.2, camY: -0.35, spin: 0.12 },
];

const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function sampleHomeJourney(t: number, out: SceneState): SceneState {
  const keys = HOME_KEYS;
  let a = keys[0];
  let b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].at && t <= keys[i + 1].at) {
      a = keys[i];
      b = keys[i + 1];
      break;
    }
  }
  const span = Math.max(1e-5, b.at - a.at);
  const k = smoother(Math.min(1, Math.max(0, (t - a.at) / span)));
  (Object.keys(out) as (keyof SceneState)[]).forEach((key) => {
    out[key] = a[key] + (b[key] - a[key]) * k;
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Per-page scene identities — one continuous organism, many states.  */
/* ------------------------------------------------------------------ */

export const PAGE_SCENES: Record<Exclude<PageKey, 'home'>, SceneState> = {
  // About — molten glass as translucent architectural material; the lab is being built.
  about: { stage: 2.85, melt: 1, bulb: 0, lattice: 0.9, flow: 0.35, warmth: 0.26, dim: 0.55, camZ: 8.0, camY: 0.15, spin: 0.1 },
  // Services — mechanical, precision-engineered chambers.
  services: { stage: 3.75, melt: 1, bulb: 0, lattice: 1, flow: 0.85, warmth: 0.38, dim: 0.62, camZ: 8.2, camY: 0, spin: 0.34 },
  // Projects — completed work illuminates pathways through the structure.
  projects: { stage: 4.0, melt: 1, bulb: 0, lattice: 1, flow: 1, warmth: 0.5, dim: 0.62, camZ: 8.6, camY: -0.1, spin: 0.18 },
  // Blog — particles become knowledge; glowing connections.
  blog: { stage: 2.35, melt: 1, bulb: 0, lattice: 0.4, flow: 0.55, warmth: 0.32, dim: 0.58, camZ: 7.4, camY: 0.1, spin: 0.08 },
  // Contact — energy returns to the centre; a new bulb slowly reforms. Warm light.
  contact: { stage: 0.28, melt: 0.14, bulb: 1, lattice: 0, flow: 0.25, warmth: 1, dim: 0.2, camZ: 6.2, camY: 0.0, spin: 0.05 },
};

export const PAGE_META: Record<PageKey, { chapter: string; caption: string }> = {
  home: { chapter: 'I — Genesis', caption: 'The Living Idea' },
  about: { chapter: 'II — Construction', caption: 'The laboratory is being built' },
  services: { chapter: 'III — Mechanism', caption: 'Six chambers, one engine' },
  projects: { chapter: 'IV — Illumination', caption: 'Energy flows through completed work' },
  blog: { chapter: 'V — Knowledge', caption: 'The organism becomes wiser' },
  contact: { chapter: 'VI — Rebirth', caption: 'The cycle begins again' },
};
