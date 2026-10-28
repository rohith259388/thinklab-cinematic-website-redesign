'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { U } from '@/lib/motion';
import { NOISE } from './glsl';
import { createGlowTexture } from './StudioEnvironment';

const GLASS_INJECT = /* glsl */ `
  // Reverse-gravity melt, injected into the physically based material so the
  // glass keeps real refraction while it deforms.
  float crown = smoothstep(0.18, 1.26, position.y);
  float rise = uMelt * crown;
  float stream = snoise(vec3(position.x * 3.0, position.y * 1.4 - uTime * 0.35, position.z * 3.0)) * 0.5 + 0.5;
  transformed.y += rise * stream * 1.55;
  transformed.xz *= 1.0 - rise * stream * 0.26;

  float tip = smoothstep(0.4, 2.3, position.y);
  transformed.x += uMelt * uPointer.x * tip * 0.46;
  transformed.z += uMelt * uPointer.y * tip * 0.28;

  float wob = snoise(position * 1.9 + vec3(0.0, uTime * 0.12, uTime * 0.07)) * 0.032;
  transformed += normal * wob * uMelt * 1.6;
  transformed *= 1.0 + uBreath * 0.005;
`;

export default function Bulb() {
  const group = useRef<THREE.Group>(null!);
  const filament = useRef<THREE.Group>(null!);
  const glow = useRef<THREE.Sprite>(null!);
  const backlight = useRef<THREE.Sprite>(null!);
  const filamentMat = useRef<THREE.MeshBasicMaterial>(null!);
  const breath = useRef({ value: 0 });
  const { size } = useThree();

  /* ——— optical glass envelope ——— */
  const glassGeo = useMemo(() => {
    const profile: Array<[number, number]> = [
      [0.005, -1.16],
      [0.255, -1.16],
      [0.265, -1.08],
      [0.30, -0.95],
      [0.395, -0.80],
      [0.555, -0.62],
      [0.755, -0.40],
      [0.905, -0.14],
      [0.985, 0.16],
      [0.985, 0.44],
      [0.885, 0.73],
      [0.695, 0.98],
      [0.425, 1.17],
      [0.165, 1.265],
      [0.005, 1.275],
    ];
    const curve = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y)));
    const geo = new THREE.LatheGeometry(curve.getPoints(288), 192);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const glassMat = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#f2eeff'),
      metalness: 0,
      roughness: 0.055,
      transmission: 1,
      thickness: 0.62,
      ior: 1.52,
      attenuationColor: new THREE.Color('#b9a4f0'),
      attenuationDistance: 1.9,
      clearcoat: 1,
      clearcoatRoughness: 0.055,
      specularIntensity: 1,
      iridescence: 0.16,
      iridescenceIOR: 1.34,
      envMapIntensity: 1.2,
      emissive: new THREE.Color('#221a3c'),
      emissiveIntensity: 0.32,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    mat.customProgramCacheKey = () => 'thinklab-molten-glass-v1';
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = U.uTime;
      shader.uniforms.uMelt = U.uMelt;
      shader.uniforms.uPointer = U.uPointer;
      shader.uniforms.uBreath = breath.current;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>\nuniform float uTime;\nuniform float uMelt;\nuniform float uBreath;\nuniform vec3 uPointer;\n${NOISE}`,
        )
        .replace('#include <begin_vertex>', `#include <begin_vertex>\n${GLASS_INJECT}`);
    };
    return mat;
  }, []);

  /* ——— internal glass stem ——— */
  const stemGeo = useMemo(() => {
    const profile: Array<[number, number]> = [
      [0.005, -1.18], [0.075, -1.16], [0.078, -1.05], [0.058, -0.9],
      [0.052, -0.78], [0.036, -0.66], [0.026, -0.6], [0.005, -0.59],
    ];
    const curve = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y)));
    const geo = new THREE.LatheGeometry(curve.getPoints(72), 48);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const stemMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#d8d0ef'),
        roughness: 0.22,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        ior: 1.46,
        envMapIntensity: 1,
      }),
    [],
  );

  /* ——— threaded, brushed-titanium base ——— */
  const capGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [
      new THREE.Vector2(0.005, -1.475),
      new THREE.Vector2(0.15, -1.475),
      new THREE.Vector2(0.196, -1.458),
      new THREE.Vector2(0.202, -1.43),
    ];
    for (let y = -1.43; y <= -1.195; y += 0.0045) {
      const thread = 0.238 + Math.sin((y + 1.43) * Math.PI * 2 * 6.5) * 0.011;
      pts.push(new THREE.Vector2(thread, y));
    }
    pts.push(new THREE.Vector2(0.258, -1.178));
    pts.push(new THREE.Vector2(0.256, -1.152));
    pts.push(new THREE.Vector2(0.02, -1.152));
    const geo = new THREE.LatheGeometry(pts, 128);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const capMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#948fa2'),
        metalness: 1,
        roughness: 0.32,
        envMapIntensity: 1.35,
      }),
    [],
  );

  const nubGeo = useMemo(() => new THREE.SphereGeometry(0.062, 24, 16), []);
  const wireGeo = useMemo(() => new THREE.CylinderGeometry(0.0065, 0.0065, 0.34, 8), []);
  const wireMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color('#8d8399'), metalness: 1, roughness: 0.38 }),
    [],
  );

  /* ——— tungsten filament ——— */
  const filamentGeo = useMemo(() => {
    const points: THREE.Vector3[] = [
      new THREE.Vector3(-0.062, -0.66, 0),
      new THREE.Vector3(-0.115, -0.5, 0),
      new THREE.Vector3(-0.2, -0.335, 0),
    ];
    const steps = 21;
    for (let i = 0; i <= steps; i++) {
      const x = -0.2 + (i / steps) * 0.4;
      const y = -0.338 + (i % 2 === 0 ? 0.016 : -0.016);
      points.push(new THREE.Vector3(x, y, i % 2 === 0 ? 0.012 : -0.012));
    }
    points.push(new THREE.Vector3(0.2, -0.335, 0));
    points.push(new THREE.Vector3(0.115, -0.5, 0));
    points.push(new THREE.Vector3(0.062, -0.66, 0));
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2);
    return new THREE.TubeGeometry(curve, 420, 0.0085, 8, false);
  }, []);

  /* ——— atmosphere ——— */
  const glowTexture = useMemo(() => createGlowTexture('rgba(255,238,206,0.95)', 'rgba(226,176,120,0.30)'), []);
  const haloTexture = useMemo(() => createGlowTexture('rgba(168,140,255,0.34)', 'rgba(96,70,180,0.13)'), []);

  useEffect(
    () => () => {
      glowTexture.dispose();
      haloTexture.dispose();
    },
    [glowTexture, haloTexture],
  );

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = clock.elapsedTime;
    breath.current.value = Math.sin(t * 1.15) * 0.5 + 0.5;

    const b = U.uBulb.value;
    const melt = U.uMelt.value;
    const g = group.current;
    if (!g) return;
    const mobile = size.width < 768;
    const stageScale = Math.max(0.0001, Math.pow(b, 0.85));
    const ease = 1 - Math.exp(-dt * 3.2);

    // The bulb sits dead-center as the focal centerpiece of "The First Spark"
    const targetX = 0 + U.uPointer.value.x * 0.12 * b;
    const targetY = (mobile ? 0.08 : 0.02) + Math.sin(t * 0.52) * 0.04 * b - U.uPointer.value.y * 0.08 * b;
    g.position.x += (targetX - g.position.x) * ease;
    g.position.y += (targetY - g.position.y) * ease;

    const baseScale = mobile ? 0.88 : 1.12;
    const s = stageScale * baseScale;
    g.scale.set(s, s * (1 + melt * 0.055), s);
    U.uBulbOffset.value.copy(g.position);
    U.uBulbScale.value = s;
    g.rotation.y = t * 0.035 * (1 - melt * 0.5) + U.uPointer.value.x * 0.08 * b;
    g.rotation.z = Math.sin(t * 0.22) * 0.012 + U.uPointer.value.x * 0.025 * b;

    const f = filament.current;
    if (f) {
      f.rotation.z += (-U.uPointer.value.x * 0.22 - f.rotation.z) * 0.06;
      f.rotation.x += (U.uPointer.value.y * 0.16 - f.rotation.x) * 0.06;
    }

    // Filament runs white-hot; it cools and dims as the glass gives way.
    const hot = (1.55 + Math.sin(t * 1.7) * 0.12 + U.uEnergy.value * 0.7) * b * U.uIntro.value;
    if (filamentMat.current) filamentMat.current.color.setRGB(1.0, 0.79, 0.52).multiplyScalar(hot);

    const flicker = 0.9 + Math.sin(t * 2.3) * 0.06 + Math.sin(t * 5.1) * 0.04;
    if (glow.current?.material) glow.current.material.opacity = 0.22 * flicker * b * U.uIntro.value;
    if (backlight.current?.material) backlight.current.material.opacity = 0.16 * b * U.uIntro.value;
  });

  return (
    <group ref={group}>
      {/* atmosphere behind the glass */}
      <sprite ref={backlight} position={[0, 0.05, -1.6]} scale={[5.4, 5.4, 1]}>
        <spriteMaterial map={haloTexture} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0} />
      </sprite>

      {/* interior: stem, supports and glowing filament */}
      <mesh geometry={stemGeo} material={stemMat} />
      <mesh geometry={wireGeo} material={wireMat} position={[-0.155, -0.48, 0]} rotation={[0, 0, -0.36]} />
      <mesh geometry={wireGeo} material={wireMat} position={[0.155, -0.48, 0]} rotation={[0, 0, 0.36]} />
      <group ref={filament}>
        <mesh geometry={filamentGeo}>
          <meshBasicMaterial ref={filamentMat} color={new THREE.Color('#ffcf9a')} toneMapped={false} />
        </mesh>
      </group>
      <sprite ref={glow} position={[0, -0.34, 0]} scale={[1.15, 1.15, 1]}>
        <spriteMaterial map={glowTexture} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0} toneMapped={false} />
      </sprite>

      {/* the envelope */}
      <mesh geometry={glassGeo} material={glassMat} renderOrder={12} />

      {/* physical base */}
      <mesh geometry={capGeo} material={capMat} />
      <mesh geometry={nubGeo} material={capMat} position={[0, -1.472, 0]} scale={[1, 0.55, 1]} />
    </group>
  );
}
