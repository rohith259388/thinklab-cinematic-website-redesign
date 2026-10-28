'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { U } from '@/lib/motion';
import { NODE_VERT, NODE_FRAG } from './glsl';
import { buildLattice } from './structure';

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * The architectural wireframe + six service chambers.
 * Rings, columns, bracing and dome ribs — the laboratory the idea grows into.
 */
export default function Lattice() {
  const group = useRef<THREE.Group>(null!);
  const lineMat = useRef<THREE.LineBasicMaterial>(null!);
  const warmMat = useRef<THREE.LineBasicMaterial>(null!);
  const nodeRefs = useRef<THREE.Mesh[]>([]);

  const { edgeGeo, chambers } = useMemo(() => {
    const l = buildLattice();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(l.segments, 3));
    return { edgeGeo: geo, chambers: l.chambers };
  }, []);

  const nodeGeo = useMemo(() => new THREE.IcosahedronGeometry(0.16, 1), []);

  const nodeMats = useMemo(
    () =>
      chambers.map(
        (_, i) =>
          new THREE.ShaderMaterial({
            vertexShader: NODE_VERT,
            fragmentShader: NODE_FRAG,
            uniforms: { ...U, uPhase: { value: i * 1.13 }, uBoost: { value: 0 } },
            transparent: true,
            depthWrite: false,
            wireframe: true,
          }),
      ),
    [chambers],
  );

  useFrame(() => {
    const s = U.uStage.value;
    const dim = U.uDim.value;
    const intro = U.uIntro.value;

    // Blueprint edges draw themselves in during stage 2.4 → 3.2.
    const edgeIn = smooth(2.35, 3.15, s);
    lineMat.current.opacity = edgeIn * 0.42 * (1 - dim * 0.55) * intro * U.uLattice.value;
    warmMat.current.opacity = edgeIn * 0.12 * U.uWarm.value * (1 - dim * 0.4) * intro;

    // Chambers ignite as the ecosystem awakens.
    const gate = smooth(2.7, 3.5, s) * intro;
    nodeMats.forEach((m) => {
      m.uniforms.uBoost.value = gate;
    });
    nodeRefs.current.forEach((n, i) => {
      if (!n) return;
      const sc = Math.max(0.0001, gate * (1 + U.uFlow.value * 0.35 * (0.5 + 0.5 * Math.sin(U.uTime.value * 1.8 - i))));
      n.scale.setScalar(sc);
    });
  });

  return (
    <group ref={group}>
      <lineSegments geometry={edgeGeo} frustumCulled={false}>
        <lineBasicMaterial
          ref={lineMat}
          color={new THREE.Color('#8f7cf5')}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      {/* warm ghost layer — the memory of molten glass inside the architecture */}
      <lineSegments geometry={edgeGeo} scale={1.006} frustumCulled={false}>
        <lineBasicMaterial
          ref={warmMat}
          color={new THREE.Color('#e4c390')}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      {chambers.map((pos, i) => (
        <mesh
          key={i}
          geometry={nodeGeo}
          material={nodeMats[i]}
          position={pos}
          scale={0.0001}
          ref={(m) => {
            if (m) nodeRefs.current[i] = m;
          }}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
