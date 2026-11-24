'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import * as THREE from 'three';
import type { ProjectCard } from './ProjectGallery';

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vK;
  uniform float uVel;
  uniform float uTime;
  uniform vec2 uBend;
  void main() {
    vUv = uv;
    vec3 p = position;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    // top ki taraf jaate hi plane peeche mudta hai
    float k = smoothstep(uBend.x, uBend.y, wp.y);
    vK = k;
    p.z -= 1200.0 * k;
    // scroll velocity pe ripple
    p.z += sin((wp.x - wp.y) * 0.02 - uTime * 2.0) * 12.0 * clamp(abs(uVel), 0.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  varying vec2 vUv;
  varying float vK;
  uniform sampler2D uTex;
  uniform vec2 uImg;
  uniform vec2 uMesh;
  uniform float uScale;
  uniform float uHasTex;
  uniform float uRadius;
  uniform vec3 uBg;
  uniform vec3 uFog;
  void main() {
    // rounded corners
    vec2 q = abs(vUv - 0.5) * uMesh - uMesh * 0.5 + uRadius;
    if (length(max(q, 0.0)) - uRadius > 0.0) discard;

    // image "contain" with padding
    vec2 box = uMesh * (1.0 - 0.36);
    float s = min(box.x / uImg.x, box.y / uImg.y);
    vec2 size = uImg * s;
    vec2 p = (vUv - 0.5) * uMesh / size / uScale + 0.5;
    vec4 t = texture2D(uTex, p);
    float inside = step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0);

    vec3 col = mix(uBg, t.rgb, t.a * inside * uHasTex);
    col = mix(col, uFog, vK * 0.85);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

interface Item {
  el: HTMLElement;
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
  const hovered = useRef(-1);
  const [gl, setGl] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return; // WebGL fallback
    }
    setGl(true);

    let W = window.innerWidth;
    let H = window.innerHeight;
    const camZ = 1500;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      (2 * Math.atan(H / 2 / camZ) * 180) / Math.PI,
      W / H,
      100,
      5000
    );
    camera.position.z = camZ;

    const geo = new THREE.PlaneGeometry(1, 1, 24, 24);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const bend = new THREE.Vector2(H * 0.05, H * 0.6);

    const items: Item[] = [];
    visualRefs.current.forEach((el, i) => {
      if (!el) return;
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        uniforms: {
          uTex: { value: null },
          uImg: { value: new THREE.Vector2(1, 1) },
          uMesh: { value: new THREE.Vector2(1, 1) },
          uScale: { value: 1 },
          uHasTex: { value: 0 },
          uRadius: { value: 24 },
          uVel: { value: 0 },
          uTime: { value: 0 },
          uBend: { value: bend },
          uBg: { value: new THREE.Color(cardBg) },
          uFog: { value: new THREE.Color(pageBg) },
        },
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      items.push({ el, mesh, mat, scale: 1 });

      const imgUrl = projects[i]?.image;
      if (imgUrl) {
        loader.load(imgUrl, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          mat.uniforms.uTex.value = tex;
          mat.uniforms.uImg.value.set(tex.image.width, tex.image.height);
          mat.uniforms.uHasTex.value = 1;
        });
      }
    });

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.fov = (2 * Math.atan(H / 2 / camZ) * 180) / Math.PI;
      camera.updateProjectionMatrix();
      bend.set(H * 0.05, H * 0.6);
    };
    window.addEventListener('resize', onResize);

    let prevY = window.scrollY;
    let vel = 0;
    let raf = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const t = clock.getElapsedTime();
      const dy = window.scrollY - prevY;
      prevY = window.scrollY;
      vel += (dy / H * 6 - vel) * 0.1;

      items.forEach((it, i) => {
        const r = it.el.getBoundingClientRect();
        const off = r.bottom < -300 || r.top > H + 300;
        it.mesh.visible = !off;
        if (off) return;

        it.mesh.scale.set(r.width, r.height, 1);
        it.mesh.position.set(
          r.left + r.width / 2 - W / 2,
          -(r.top + r.height / 2 - H / 2),
          0
        );

        const target = hovered.current === i ? 1.08 : 1;
        it.scale += (target - it.scale) * 0.1;
        const u = it.mat.uniforms;
        u.uScale.value = it.scale;
        u.uMesh.value.set(r.width, r.height);
        u.uVel.value = vel;
        u.uTime.value = t;
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      items.forEach((it) => {
        it.mat.uniforms.uTex.value?.dispose();
        it.mat.dispose();
      });
      geo.dispose();
      renderer.dispose();
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
        {projects.map((p, i) => (
          <Link
            key={p.slug}
            href={p.href}
            className="group block"
            onPointerEnter={() => (hovered.current = i)}
            onPointerLeave={() => (hovered.current = -1)}
            aria-label={`${p.title} — view project`}
          >
            <div
              ref={(el) => {
                visualRefs.current[i] = el;
              }}
              className="relative aspect-[820/430] w-full overflow-hidden rounded-3xl bg-white"
            >
              {/* WebGL fallback */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain p-[18%]"
                style={{ opacity: gl ? 0 : 1 }}
              />
            </div>
            <div className="mt-4 flex items-end justify-between border-b border-black/20 pb-3">
              <div>
                <h3 className="text-[26px] font-semibold leading-tight text-[#20211f]">{p.title}</h3>
                <p className="text-[18px] leading-tight text-[#71736d] mt-1">{p.tags}</p>
              </div>
              <ArrowUpRight className="text-[#20211f] transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
