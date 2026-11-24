'use client';

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { motion, U } from '@/lib/motion';
import Bulb from './Bulb';
import Particles from './Particles';
import Lattice from './Lattice';
import { createStudioEnvironment } from './StudioEnvironment';

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export type Quality = 'low' | 'mid' | 'high';

export function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'high';
  const cores = navigator.hardwareConcurrency ?? 8;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || cores <= 4) return 'low';
  if (mobile || cores <= 6) return 'mid';
  return 'high';
}

const COLD_BG = new THREE.Color('#06050a');
const WARM_BG = new THREE.Color('#181007');
const COLD_FOG = new THREE.Color('#07060c');
const WARM_FOG = new THREE.Color('#221609');

/** Reads the global motion store and conducts the whole organism. */
function Rig({ fx }: { fx: boolean }) {
  const organism = useRef<THREE.Group>(null!);
  const amb = useRef<THREE.AmbientLight>(null!);
  const keyViolet = useRef<THREE.PointLight>(null!);
  const keyWarm = useRef<THREE.PointLight>(null!);
  const rimWhite = useRef<THREE.PointLight>(null!);
  const rot = useRef(0);
  const bg = useRef(new THREE.Color('#06050a'));
  const fog = useRef(new THREE.Color('#07060c'));
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    scene.background = bg.current;
    scene.fog = new THREE.FogExp2(fog.current.getHex(), 0.045);

    // Real captured-light reflections for the glass and metal.
    const env = createStudioEnvironment(gl);
    scene.environment = env.texture;
    scene.environmentIntensity = 1.05;
    gl.transmissionResolutionScale = 0.6;

    return () => {
      scene.fog = null;
      scene.environment = null;
      env.dispose();
    };
  }, [scene, gl]);

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = clock.elapsedTime;
    U.uTime.value = t;

    // Ease the entire state toward its target — page changes become transformations.
    const c = motion.current;
    const tg = motion.target;
    const damp = 1 - Math.exp(-dt * 2.6);
    (Object.keys(c) as (keyof typeof c)[]).forEach((k) => {
      c[k] += (tg[k] - c[k]) * damp;
    });

    // Pointer easing + kinetic energy.
    const p = motion.pointer;
    const px = p.x;
    const py = p.y;
    p.x += (p.tx - p.x) * (1 - Math.exp(-dt * 4.2));
    p.y += (p.ty - p.y) * (1 - Math.exp(-dt * 4.2));
    const inst = Math.abs(p.x - px) + Math.abs(p.y - py);
    motion.energy = Math.max(motion.energy * Math.exp(-dt * 1.8), Math.min(1, inst * 22));

    // Intro ramp after the preloader ignite.
    U.uIntro.value += ((motion.ready ? 1 : 0) - U.uIntro.value) * (1 - Math.exp(-dt * 1.6));

    U.uStage.value = c.stage;
    U.uMelt.value = c.melt;
    U.uBulb.value = c.bulb;
    U.uLattice.value = c.lattice;
    U.uFlow.value = c.flow;
    U.uWarm.value = c.warmth;
    U.uDim.value = c.dim;
    U.uEnergy.value = motion.energy;
    U.uPointer.value.set(p.x, p.y);
    U.uPixelRatio.value = gl.getPixelRatio();

    // The structure slowly revolves once the idea has architecture.
    const spinMask = smooth(0.6, 1.8, c.stage);
    rot.current += dt * (c.spin * spinMask + 0.008);
    organism.current.rotation.y = rot.current;
    organism.current.rotation.x = 0.05 + p.y * 0.05 * (1 - c.bulb);

    // Cinematic camera drift — never cuts, always floats.
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.x = Math.sin(t * 0.04) * 0.14 + p.x * 0.22;
    cam.position.y = c.camY + Math.sin(t * 0.035) * 0.08 - p.y * 0.18;
    cam.position.z = c.camZ;
    cam.lookAt(0, 0.02, 0);

    // Evolving light: near black → glass reflections → warm architecture.
    const w = c.warmth * (1 - c.dim * 0.35);
    bg.current.lerpColors(COLD_BG, WARM_BG, w);
    fog.current.lerpColors(COLD_FOG, WARM_FOG, w);
    if (scene.fog instanceof THREE.FogExp2) scene.fog.color.copy(fog.current);

    const vis = (1 - c.dim * 0.55) * U.uIntro.value;
    amb.current.intensity = (0.05 + w * 0.16) * vis + 0.03;
    keyViolet.current.intensity = (2.6 + c.stage * 1.1 + motion.energy * 3.4) * vis;
    keyWarm.current.intensity = w * 9 * vis;
    rimWhite.current.intensity = (1.8 + c.flow * 1.6) * vis;

    // Bulb breathes light from inside when alive.
    keyViolet.current.position.set(2.6 + p.x * 0.6, 2.4, 2.8);
  });

  return (
    <>
      <ambientLight ref={amb} intensity={0.1} color={new THREE.Color('#e9e3dc')} />
      <pointLight ref={keyViolet} intensity={7} distance={24} decay={2} color={new THREE.Color('#7e6ff0')} position={[2.6, 2.4, 2.8]} />
      <pointLight ref={keyWarm} intensity={0} distance={26} decay={2} color={new THREE.Color('#e4c390')} position={[-3.4, -2.4, -2.6]} />
      <pointLight ref={rimWhite} intensity={4.5} distance={26} decay={2} color={new THREE.Color('#fcfcf7')} position={[0, 4.2, 4.6]} />
      <group ref={organism}>
        <Particles count={fx ? 7600 : 3400} />
        <Lattice />
      </group>
      <Bulb />
    </>
  );
}

// True while a project card ↔ hero transition covers the screen (html[data-pt]).
const subscribePt = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-pt'] });
  return () => mo.disconnect();
};
const ptActive = () => Boolean(document.documentElement.dataset.pt);

export default function ExperienceCanvas() {
  const quality = useMemo<Quality>(() => detectQuality(), []);
  // Freeze the organism (and its bloom pass) during transitions so the main thread and GPU
  // are free for the panel morph — matters most on low-power Windows/Android devices.
  const paused = useSyncExternalStore(subscribePt, ptActive, () => false);

  useEffect(() => {
    motion.reduced = quality === 'low';
  }, [quality]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        frameloop={paused ? 'never' : 'always'}
        dpr={quality === 'high' ? [1, 1.8] : quality === 'mid' ? [1, 1.5] : 1}
        camera={{ fov: 40, near: 0.1, far: 60, position: [0, 0.05, 6.4] }}
        gl={{ antialias: true, alpha: false, stencil: false, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'none' }}
      >
        <Rig fx={quality !== 'low'} />
        {quality !== 'low' && (
          <EffectComposer multisampling={quality === 'high' ? 4 : 2}>
            <Bloom mipmapBlur intensity={0.52} luminanceThreshold={0.55} luminanceSmoothing={0.28} radius={0.5} />
            <Vignette offset={0.24} darkness={0.72} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
