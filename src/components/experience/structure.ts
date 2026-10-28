import * as THREE from 'three';

/**
 * The architectural blueprint of the laboratory:
 * twisted ring levels + columns + diagonals + dome ribs.
 * Shared by the particle formations and the wireframe lattice.
 */

const LEVELS: Array<[number, number]> = [
  [-1.2, 1.05],
  [-0.6, 1.7],
  [0.05, 2.0],
  [0.68, 1.85],
  [1.2, 1.35],
  [1.6, 0.62],
];
const SEG = 24;
const TWIST = 0.13;

export function ringPoint(level: number, i: number, out = new THREE.Vector3()): THREE.Vector3 {
  const [y, r] = LEVELS[level];
  const theta = (i / SEG) * Math.PI * 2 + level * TWIST;
  return out.set(r * Math.cos(theta), y, r * Math.sin(theta));
}

const BOT = new THREE.Vector3(0, -1.78, 0);
const TOP = new THREE.Vector3(0, 1.98, 0);

export function ribPoint(m: number, q: number, out = new THREE.Vector3()): THREE.Vector3 {
  const theta = (m / 10) * Math.PI * 2;
  const bulge = Math.sin(q * Math.PI) * 1.62;
  out.lerpVectors(BOT, TOP, q);
  out.x += Math.cos(theta) * bulge;
  out.z += Math.sin(theta) * bulge;
  return out;
}

export interface Lattice {
  segments: Float32Array;
  vertexCount: number;
  chambers: THREE.Vector3[];
}

export function buildLattice(): Lattice {
  const seg: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();

  const push = (p: THREE.Vector3, q: THREE.Vector3) => {
    seg.push(p.x, p.y, p.z, q.x, q.y, q.z);
  };

  // Rings
  for (let l = 0; l < LEVELS.length; l++) {
    for (let i = 0; i < SEG; i++) {
      ringPoint(l, i, a);
      ringPoint(l, i + 1, b);
      push(a, b);
    }
  }
  // Columns
  for (let l = 0; l < LEVELS.length - 1; l++) {
    for (let i = 0; i < SEG; i += 2) {
      ringPoint(l, i, a);
      ringPoint(l + 1, i, b);
      push(a, b);
    }
  }
  // Diagonal bracing
  for (let l = 0; l < LEVELS.length - 1; l++) {
    for (let i = 0; i < SEG; i += 6) {
      ringPoint(l, i, a);
      ringPoint(l + 1, i + 1, b);
      push(a, b);
    }
  }
  // Dome ribs
  for (let m = 0; m < 10; m++) {
    let prev = ribPoint(m, 0, new THREE.Vector3());
    for (let s = 1; s <= 12; s++) {
      const cur = ribPoint(m, s / 12, new THREE.Vector3());
      push(prev, cur);
      prev = cur;
    }
  }

  // Six service chambers positioned on the widest ring level.
  const chambers: THREE.Vector3[] = [];
  for (let c = 0; c < 6; c++) {
    chambers.push(ringPoint(3, c * 4, new THREE.Vector3()).multiplyScalar(1.06));
  }

  return { segments: new Float32Array(seg), vertexCount: seg.length / 3, chambers };
}

/** Sample the lattice edges uniformly for particle formations. */
export function sampleLatticePoint(l: Lattice, rand: () => number, out = new THREE.Vector3()): THREE.Vector3 {
  const segCount = l.segments.length / 6;
  const s = Math.floor(rand() * segCount) * 6;
  const t = rand();
  out.set(
    l.segments[s] + (l.segments[s + 3] - l.segments[s]) * t,
    l.segments[s + 1] + (l.segments[s + 4] - l.segments[s + 1]) * t,
    l.segments[s + 2] + (l.segments[s + 5] - l.segments[s + 2]) * t,
  );
  return out;
}
