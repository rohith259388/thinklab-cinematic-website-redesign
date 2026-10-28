/** Viewport lens field: horizontal displacement at the top/bottom, none at mid-screen. */
export function createProjectBendMap(size = 129) {
  const pixels = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const edge = 1 - Math.sin(Math.PI * y / (size - 1));
      const i = (y * size + x) * 4;
      pixels[i] = 127.5 - 255 * (x / (size - 1) - .5) * edge;
      pixels[i + 1] = 128;
      pixels[i + 2] = 128;
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

/** Scroll distance is measured in screen heights; direction does not reverse the lens. */
export function easeProjectBend(current: number, deltaPixels: number, deltaMs: number, viewportHeight: number) {
  const next = Math.min(1, (current + Math.abs(deltaPixels) / Math.max(1, viewportHeight)) * Math.exp(-deltaMs / 100));
  return next < .0001 ? 0 : next;
}

/** Finish before browser pixel rounding can leave an unreachable scroll target. */
export function nextProjectScroll(current: number, target: number, deltaMs: number) {
  const step = (target - current) * (1 - Math.exp(-12 * deltaMs / 1000));
  return Math.abs(step) < 1 ? target : current + step;
}
