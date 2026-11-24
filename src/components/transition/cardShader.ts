/**
 * The project-card shader, shared by the WebGL gallery and the card ↔ hero transition so the
 * expanding card is pixel-for-pixel the card you clicked (same bend curve, fog, logo fit).
 *
 * Extra uniforms over the original gallery shader:
 *   uAmt — how much of the bend/fog applies (1 in the gallery; eases to 0 as the card opens)
 *   uIns — logo box insets as fractions of the card (top, right, bottom, left)
 */

export const CAM_Z = 1500; // camera distance; 1 world unit = 1 CSS px on the z = 0 plane
export const BEND_DEPTH = 1200; // how far a card is pushed back at full bend
export const CARD_RADIUS = 24;
export const CARD_PAD = 0.18; // logo box inset on a card (the original 0.36 total padding)
/** World-y range (relative to the viewport centre, +up) over which cards bend back. */
export const bendRange = (H: number): [number, number] => [H * 0.05, H * 0.6];

export const CARD_VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vK;
  uniform float uVel;
  uniform float uTime;
  uniform float uAmt;
  uniform vec2 uBend;
  void main() {
    vUv = uv;
    vec3 p = position;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    // Smoothly curve backwards into 3D z-depth as plane moves towards the top
    float k = smoothstep(uBend.x, uBend.y, wp.y) * uAmt;
    vK = k;
    p.z -= ${BEND_DEPTH.toFixed(1)} * k;
    // Scroll velocity ripple wave
    p.z += sin((wp.x - wp.y) * 0.02 - uTime * 2.0) * 14.0 * clamp(abs(uVel), 0.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const CARD_FRAG = /* glsl */ `
  varying vec2 vUv;
  varying float vK;
  uniform sampler2D uTex;
  uniform vec2 uImg;
  uniform vec2 uMesh;
  uniform float uScale;
  uniform float uHasTex;
  uniform float uRadius;
  uniform float uBorder;
  uniform vec4 uIns;
  uniform vec3 uBg;
  uniform vec3 uFog;
  void main() {
    // Rounded corners for the white 3D card
    vec2 q = abs(vUv - 0.5) * uMesh - uMesh * 0.5 + uRadius;
    float dist = length(max(q, 0.0)) - uRadius;
    if (dist > 0.0) discard;

    // Subtle premium border stroke on the card edge
    float border = smoothstep(0.0, -1.2, dist) - smoothstep(-1.2, -2.4, dist);

    // Contain the image inside the logo box (uv is bottom-up, insets are top/right/bottom/left)
    vec2 box = uMesh * vec2(1.0 - uIns.w - uIns.y, 1.0 - uIns.x - uIns.z);
    vec2 c = vec2((uIns.w + 1.0 - uIns.y) * 0.5, (uIns.z + 1.0 - uIns.x) * 0.5);
    float s = min(box.x / uImg.x, box.y / uImg.y);
    vec2 size = uImg * s;
    vec2 p = (vUv - c) * uMesh / size / uScale + 0.5;
    vec4 t = texture2D(uTex, p);
    float inside = step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0);

    // Mix white card surface with texture, add border accent
    vec3 col = mix(uBg, t.rgb, t.a * inside * uHasTex);
    col = mix(col, vec3(0.12, 0.13, 0.12), border * 0.06 * uBorder);

    // Fog fade into the paper background
    col = mix(col, uFog, vK * 0.85);

    // Smoothly dissolve alpha near the very top edge
    float alpha = 1.0 - smoothstep(0.85, 1.0, vK);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;
