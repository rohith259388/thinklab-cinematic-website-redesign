import assert from 'node:assert/strict';
import { createProjectBendMap, easeProjectBend, nextProjectScroll } from '../src/lib/project-bend.ts';
const size = 129;
const map = createProjectBendMap(size);
const pixel = (x, y, channel) => map[(y * size + x) * 4 + channel];
assert.equal(map.length, size * size * 4);
assert.equal(pixel(0, 64, 0), 128, 'mid-screen must remain flat');
assert.equal(pixel(128, 64, 0), 128, 'mid-screen must remain flat on both sides');
assert.equal(pixel(0, 0, 0), 255, 'left edge samples inward to push the silhouette outward');
assert.equal(pixel(128, 0, 0), 0, 'right edge must mirror the left');
assert.equal(pixel(0, 0, 0), pixel(0, 128, 0), 'top and bottom must bend equally');
for (let i = 1; i < map.length; i += 4) assert.equal(map[i], 128, 'no vertical fabric bend');
assert.equal(easeProjectBend(.1, 120, 16, 800), easeProjectBend(.1, -120, 16, 800), 'scroll direction must not reverse distortion');
assert.equal(easeProjectBend(0, 120, 16, 800), easeProjectBend(0, 60, 16, 400), 'response must normalize to viewport height');
const decay = hz => { let v = 1; for (let i = 0; i < hz / 2; i++) v = easeProjectBend(v, 0, 1000 / hz, 800); return v; };
assert.ok(Math.abs(decay(60) - decay(120)) < .00001, 'settling must be refresh-rate independent');
let settled = 1; for (let i = 0; i < 100; i++) settled = easeProjectBend(settled, 0, 16, 800);
assert.equal(settled, 0, 'idle must remove the filter completely');
console.log('Project scroll lens: screen position, symmetry, direction, viewport normalization and settling passed.');

// Model browsers that round scroll positions to whole pixels, in both directions.
for (const hz of [60, 120, 240]) {
  for (const target of [1200, 800]) {
    let position = 1000;
    let released = false;
    for (let i = 0; i < hz * 2; i++) {
      const next = nextProjectScroll(position, target, 1000 / hz);
      position = Math.round(next);
      if (next === target) { released = true; break; }
    }
    assert.ok(released, `scroll target must release at ${hz}Hz`);
    assert.equal(position, target);
  }
}
console.log('Scroll handoff: pixel-rounded scrolling releases in both directions at 60/120/240Hz.');
