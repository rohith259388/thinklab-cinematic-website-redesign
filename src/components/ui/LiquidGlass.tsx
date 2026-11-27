'use client';

import { Fragment, useEffect, useId, useState, type RefObject } from 'react';

/*
 * Liquid glass refraction, adapted from glisse (https://github.com/0kzh/glisse, MIT).
 *
 * A displacement map is generated for the element's exact size: pixels in a
 * band along the rounded edge are pulled inward following a Snell's-law bezel
 * profile, so the backdrop bends like light through the rim of a glass slab.
 * The map drives an SVG feDisplacementMap applied through `backdrop-filter`,
 * with slightly different strengths per colour channel for dispersion.
 *
 * Only Chromium applies SVG filters to the live backdrop; other browsers keep
 * the CSS frost + rim light fallback (blur + saturate via `--lg-filter`).
 */

/** Bezel profile: refraction through a squircle surface with index 1.5. */
const BEZEL = (() => {
  const samples = new Float32Array(256);
  let most = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = Math.max(0.004, i / (samples.length - 1));
    const surface = (1 - (1 - t) ** 4) ** 0.25;
    const incident = Math.atan((1 - t) ** 3 / surface ** 3);
    const refracted = Math.asin(Math.sin(incident) / 1.5);
    samples[i] = Math.tan(incident - refracted) * (0.6 + surface);
    most = Math.max(most, samples[i]);
  }
  return samples.map((s) => s / most);
})();

const bezel = (t: number) => BEZEL[Math.min(255, Math.max(0, Math.round(t * 255)))];

/** Signed distance from (x, y) to a centred rounded rectangle. */
function distance(x: number, y: number, hw: number, hh: number, r: number) {
  const qx = Math.abs(x) - hw + r;
  const qy = Math.abs(y) - hh + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

type LensMap = { url: string; width: number; height: number; reach: number };

function buildMap(width: number, height: number, radius: number): LensMap | null {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw, hh);
  const depth = Math.min(0.3 * Math.min(width, height), 36);
  const img = ctx.createImageData(width, height);
  const d = img.data;

  for (let py = 0; py < height; py++) {
    const y = py + 0.5 - hh;
    for (let px = 0; px < width; px++) {
      const x = px + 0.5 - hw;
      const i = (py * width + px) * 4;
      let dx = 0;
      let dy = 0;
      const edge = distance(x, y, hw, hh, r);
      if (edge < 0 && -edge < depth) {
        const qx = Math.abs(x) - hw + r;
        const qy = Math.abs(y) - hh + r;
        if (qx > 0 && qy > 0) {
          const len = Math.hypot(qx, qy);
          dx = (Math.sign(x) * qx) / len;
          dy = (Math.sign(y) * qy) / len;
        } else if (qx > qy) dx = Math.sign(x);
        else dy = Math.sign(y);
        const amount = bezel(-edge / depth);
        dx *= amount;
        dy *= amount;
      }
      d[i] = Math.round((0.5 - 0.5 * dx) * 255);
      d[i + 1] = Math.round((0.5 - 0.5 * dy) * 255);
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { url: canvas.toDataURL('image/png'), width, height, reach: 2 * depth };
}

const CHANNELS = [
  { key: 'r', factor: 1.12, matrix: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { key: 'g', factor: 1.06, matrix: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' },
  { key: 'b', factor: 1, matrix: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0' },
];

/**
 * Renders the hidden SVG filter and wires it into `target`'s backdrop-filter
 * through the `--lg-filter` custom property. Re-fits the map on resize.
 */
export default function LiquidGlass({ target }: { target: RefObject<HTMLElement | null> }) {
  const id = `lg-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [map, setMap] = useState<LensMap | null>(null);

  useEffect(() => {
    const el = target.current;
    if (!el || !/Chrom(?:e|ium)\//.test(navigator.userAgent)) return;

    let frame = 0;
    let last = '';
    const fit = () => {
      frame = 0;
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      const key = `${w}x${h}x${radius}`;
      if (!w || !h || key === last) return;
      last = key;
      setMap(buildMap(w, h, radius));
    };
    const ro = new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(fit);
    });
    ro.observe(el);
    fit();
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
      el.style.removeProperty('--lg-filter');
    };
  }, [target]);

  useEffect(() => {
    const el = target.current;
    if (el && map) el.style.setProperty('--lg-filter', `url("#${id}") saturate(1.6)`);
  }, [map, id, target]);

  if (!map) return null;

  return (
    <svg aria-hidden="true" focusable="false" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <filter
        id={id}
        x="0"
        y="0"
        width={map.width}
        height={map.height}
        filterUnits="userSpaceOnUse"
        primitiveUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feImage href={map.url} x="0" y="0" width={map.width} height={map.height} preserveAspectRatio="none" result="map" />
        {CHANNELS.map((c) => (
          <Fragment key={c.key}>
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={map.reach * c.factor}
              xChannelSelector="R"
              yChannelSelector="G"
              result={`bent-${c.key}`}
            />
            <feColorMatrix in={`bent-${c.key}`} type="matrix" values={c.matrix} result={`ch-${c.key}`} />
          </Fragment>
        ))}
        <feComposite in="ch-r" in2="ch-g" operator="arithmetic" k2="1" k3="1" result="rg" />
        <feComposite in="rg" in2="ch-b" operator="arithmetic" k2="1" k3="1" />
      </filter>
    </svg>
  );
}
