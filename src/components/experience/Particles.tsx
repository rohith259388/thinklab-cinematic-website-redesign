'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { U } from '@/lib/motion';
import { PARTICLE_VERT, PARTICLE_FRAG } from './glsl';
import { buildLattice, sampleLatticePoint } from './structure';

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

interface Props {
  count?: number;
}

/**
 * Thousands of luminous particles — every particle an idea.
 * Formations: bulb interior → rising liquid → diaspora → blueprint → ecosystem.
 */
export default function Particles({ count = 7200 }: Props) {
  const lineMat = useRef<THREE.LineBasicMaterial>(null!);

  const geometry = useMemo(() => {
    const rand = mulberry32(1337);
    const lattice = buildLattice();
    const v = new THREE.Vector3();

    const f0 = new Float32Array(count * 3);
    const f1 = new Float32Array(count * 3);
    const f2 = new Float32Array(count * 3);
    const f3 = new Float32Array(count * 3);
    const f4 = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    const siz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = rand();
      rnd[i] = r;
      siz[i] = 0.5 + rand() * 1.25;

      // F0 — inner cosmos of the bulb.
      const rad = 0.42 * Math.pow(rand(), 0.55);
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(rand() * 2 - 1);
      f0[i * 3] = rad * Math.sin(ph) * Math.cos(th);
      f0[i * 3 + 1] = rad * Math.cos(ph) * 1.15 - 0.05;
      f0[i * 3 + 2] = rad * Math.sin(ph) * Math.sin(th);

      // F1 — liquid rising against gravity.
      const rise = Math.pow(rand(), 1.35);
      const yy = -0.2 + rise * 2.9;
      const taper = 0.34 * (1 - rise * 0.45) * Math.sqrt(rand());
      const aa = rand() * Math.PI * 2;
      let x = Math.cos(aa) * taper;
      let z = Math.sin(aa) * taper;
      let y = yy;
      if (rand() > 0.86) {
        // stretched droplets separating from the stream
        y += 0.35 + rand() * 1.1;
        const rr = 0.06 + rand() * 0.1;
        x = Math.cos(aa) * rr;
        z = Math.sin(aa) * rr;
      }
      f1[i * 3] = x;
      f1[i * 3 + 1] = y;
      f1[i * 3 + 2] = z;

      // F2 — diaspora cloud.
      const dir = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      const dist = 1.55 + 1.05 * Math.pow(rand(), 0.85);
      f2[i * 3] = dir.x * dist;
      f2[i * 3 + 1] = dir.y * dist * 0.92;
      f2[i * 3 + 2] = dir.z * dist;

      // F3 — the blueprint: particles settle onto the lattice.
      sampleLatticePoint(lattice, rand, v);
      const j = 0.02 + rand() * 0.03;
      f3[i * 3] = v.x + (rand() - 0.5) * j;
      f3[i * 3 + 1] = v.y + (rand() - 0.5) * j;
      f3[i * 3 + 2] = v.z + (rand() - 0.5) * j;

      // F4 — the living ecosystem: structure + orbital halos.
      const pick = rand();
      if (pick < 0.68) {
        sampleLatticePoint(lattice, rand, v);
        f4[i * 3] = v.x;
        f4[i * 3 + 1] = v.y;
        f4[i * 3 + 2] = v.z;
      } else if (pick < 0.84) {
        const a = rand() * Math.PI * 2;
        const rr = 3.15 + (rand() - 0.5) * 0.14;
        v.set(Math.cos(a) * rr, (rand() - 0.5) * 0.1, Math.sin(a) * rr);
        v.applyEuler(new THREE.Euler(0.32, 0, 0.1));
        f4[i * 3] = v.x;
        f4[i * 3 + 1] = v.y + 0.1;
        f4[i * 3 + 2] = v.z;
      } else if (pick < 0.95) {
        const a = rand() * Math.PI * 2;
        const rr = 3.95 + (rand() - 0.5) * 0.2;
        v.set(Math.cos(a) * rr, (rand() - 0.5) * 0.14, Math.sin(a) * rr);
        v.applyEuler(new THREE.Euler(-0.2, 0, 0.52));
        f4[i * 3] = v.x;
        f4[i * 3 + 1] = v.y - 0.15;
        f4[i * 3 + 2] = v.z;
      } else {
        const dir2 = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
        const d2 = 3.6 + rand() * 1.4;
        f4[i * 3] = dir2.x * d2;
        f4[i * 3 + 1] = dir2.y * d2;
        f4[i * 3 + 2] = dir2.z * d2;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(f0, 3));
    geo.setAttribute('aF1', new THREE.BufferAttribute(f1, 3));
    geo.setAttribute('aF2', new THREE.BufferAttribute(f2, 3));
    geo.setAttribute('aF3', new THREE.BufferAttribute(f3, 3));
    geo.setAttribute('aF4', new THREE.BufferAttribute(f4, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
    return geo;
  }, [count]);

  /** "Invisible mathematical relationships" — precomputed affinity links in the diaspora cloud. */
  const linkGeo = useMemo(() => {
    const rand = mulberry32(9001);
    const pos = geometry.getAttribute('aF2') as THREE.BufferAttribute;
    const links: number[] = [];
    const sample = 320;
    let made = 0;
    for (let i = 0; i < sample * 30 && made < 210; i++) {
      const a = Math.floor(rand() * count);
      const b = Math.floor(rand() * count);
      if (a === b) continue;
      const dx = pos.getX(a) - pos.getX(b);
      const dy = pos.getY(a) - pos.getY(b);
      const dz = pos.getZ(a) - pos.getZ(b);
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 0.85) {
        links.push(pos.getX(a), pos.getY(a), pos.getZ(a), pos.getX(b), pos.getY(b), pos.getZ(b));
        made++;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(links), 3));
    return geo;
  }, [geometry, count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VERT,
        fragmentShader: PARTICLE_FRAG,
        uniforms: { ...U },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame(() => {
    // Links glow only while the diaspora is learning to connect.
    const s = U.uStage.value;
    const band = smooth(1.55, 2.0, s) * (1 - smooth(2.55, 3.05, s));
    lineMat.current.opacity = band * 0.34 * (1 - U.uDim.value * 0.7) * U.uIntro.value;
  });

  return (
    <>
      <points geometry={geometry} material={material} frustumCulled={false} />
      <lineSegments geometry={linkGeo} frustumCulled={false}>
        <lineBasicMaterial
          ref={lineMat}
          color={new THREE.Color('#a280ff')}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </>
  );
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
