import * as THREE from 'three';

/**
 * A photographic studio built only for reflections.
 *
 * The scene stays black; several emissive panels (a violet key softbox, a
 * narrow white strip, a warm fill and a top ring) are prefiltered into an
 * environment map. Physically based glass and metal then reflect real,
 * directional light instead of painted-on gradients.
 */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color('#05040a');

  const geometry = new THREE.PlaneGeometry(1, 1);
  const disposables: THREE.Material[] = [];

  const panel = (
    color: string,
    intensity: number,
    position: [number, number, number],
    size: [number, number],
    lookAt: [number, number, number] = [0, 0, 0],
  ) => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    disposables.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(size[0], size[1], 1);
    mesh.lookAt(...lookAt);
    envScene.add(mesh);
  };

  // Key softbox — large, violet, camera-left.
  panel('#b9a6ff', 2.1, [-5.5, 3.4, 4.2], [2.6, 5.2]);
  // A tall, narrow strip — this is the crisp vertical highlight on the glass.
  panel('#ffffff', 4.6, [-2.2, 1.6, 5.4], [0.42, 4.4]);
  // Secondary hairline strip, right side, cooler.
  panel('#dfe6ff', 2.0, [4.6, 2.2, 3.4], [0.28, 3.6]);
  // Warm champagne bounce from below and behind.
  panel('#e4c390', 1.25, [0.6, -3.6, -4.6], [6.4, 2.4]);
  // Overhead ring light approximated by a soft wide panel.
  panel('#fcfcf7', 1.15, [0.4, 5.6, 0.4], [5.2, 5.2], [0, 0, 0]);
  // Deep violet wash so the dark side of the metal never goes flat black.
  panel('#4a2fa8', 0.85, [3.4, -1.4, -5.2], [4.6, 3.2]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(envScene, 0.018, 0.1, 60);

  const dispose = () => {
    target.dispose();
    pmrem.dispose();
    geometry.dispose();
    disposables.forEach((m) => m.dispose());
    envScene.clear();
  };

  return { texture: target.texture, dispose };
}

/** Soft radial falloff used for filament glow and atmospheric separation. */
export function createGlowTexture(inner: string, mid: string) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.28, mid);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
