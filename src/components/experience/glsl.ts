/**
 * GLSL library for the Living Idea organism.
 * Optical molten glass · liquid crystal · thin white light · violet emissive.
 */

export const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0*floor(p*ns.z*ns.z);
  vec4 x_ = floor(j*ns.z);
  vec4 y_ = floor(j - 7.0*x_);
  vec4 x = x_*ns.x + ns.yyyy;
  vec4 y = y_*ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m*m;
  return 42.0*dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

/* ------------------------------------------------------------------ */
/* Molten glass bulb                                                  */
/* ------------------------------------------------------------------ */

export const BULB_VERT = /* glsl */ `
uniform float uTime;
uniform float uMelt;
uniform float uBreath;
uniform vec2  uPointer;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vPos;
${NOISE}
void main() {
  vec3 pos = position;
  vec3 nrm = normal;

  float t = uTime;

  // Pristine optical glass at rest; fluid asymmetry only emerges as it melts.
  float wob = snoise(pos * 1.8 + vec3(0.0, t * 0.12, t * 0.07)) * 0.038
            + snoise(pos * 4.0 - vec3(t * 0.05)) * 0.012;
  pos += nrm * wob * (0.04 + uMelt * 1.9);

  // Reverse-gravity melt — liquid rises UP from the rounded crown.
  float crown = smoothstep(0.2, 1.24, pos.y);
  float rise = uMelt * crown;
  float stream = snoise(vec3(pos.x * 3.0, pos.y * 1.4 - t * 0.35, pos.z * 3.0)) * 0.5 + 0.5;
  pos.y += rise * stream * 1.6;
  pos.xz *= 1.0 - rise * stream * 0.28;

  // Only liquid glass, never the intact envelope, leans toward the cursor.
  float tipInfluence = smoothstep(0.45, 2.4, pos.y);
  pos.x += uMelt * uPointer.x * tipInfluence * 0.48;
  pos.z += uMelt * uPointer.y * tipInfluence * 0.30;

  // The neck sags subtly after the bulb has begun to lose its shape.
  float skirt = 1.0 - smoothstep(-1.1, -0.45, pos.y);
  pos.y -= uMelt * skirt * 0.18 * (0.5 + 0.5 * snoise(vec3(pos.xz * 2.0, t * 0.1)));

  // Breathing.
  pos *= 1.0 + uBreath * 0.018;

  vPos = pos;
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * nrm);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const BULB_FRAG = /* glsl */ `
uniform float uTime;
uniform float uEnergy;
uniform float uWarm;
uniform float uIntro;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vPos;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  float face = max(dot(N, V), 0.0);
  float rim = pow(1.0 - face, 3.0);

  // A pair of softbox reflections, not a glowing second shell. They glide
  // slowly across the glass while the single physical silhouette stays crisp.
  vec3 R = reflect(-V, N);
  float strip = exp(-pow((R.x + 0.36 + 0.05 * sin(uTime * 0.32)) / 0.14, 2.0));
  strip *= smoothstep(-0.95, -0.35, R.y) * (1.0 - smoothstep(0.6, 0.99, R.y));
  float shoulder = exp(-pow((R.y - 0.52 - 0.04 * sin(uTime * 0.23)) / 0.16, 2.0));
  shoulder *= smoothstep(0.05, 0.65, R.x);

  vec3 graphite = vec3(0.025, 0.023, 0.038);
  vec3 violet = vec3(0.49, 0.43, 0.88);
  vec3 lavender = vec3(0.74, 0.65, 0.98);
  vec3 champagne = vec3(0.90, 0.76, 0.55);
  vec3 edge = mix(violet, champagne, uWarm * 0.5);

  // Deep transparent centre, soft inner reflections, luminous but slim rim.
  float heart = (1.0 - smoothstep(-0.55, 0.48, vPos.y)) * face;
  vec3 col = graphite * 0.7;
  col += edge * rim * (0.72 + uEnergy * 0.45);
  col += lavender * strip * 0.20;
  col += vec3(0.95, 0.91, 1.0) * shoulder * 0.16;
  col += mix(violet, champagne, uWarm) * heart * 0.085;

  float alpha = (0.24 + rim * 0.60 + strip * 0.08 + shoulder * 0.07) * uIntro;
  gl_FragColor = vec4(col * uIntro, min(alpha, 0.92));
}
`;

/* ------------------------------------------------------------------ */
/* GPU particle organism — morphs between five formations             */
/* ------------------------------------------------------------------ */

export const PARTICLE_VERT = /* glsl */ `
uniform float uTime;
uniform float uStage;
uniform float uPixelRatio;
uniform float uDim;
uniform float uIntro;
uniform vec2  uPointer;
uniform float uEnergy;
uniform vec3 uBulbOffset;
uniform float uBulbScale;
attribute vec3 aF1;
attribute vec3 aF2;
attribute vec3 aF3;
attribute vec3 aF4;
attribute float aRand;
attribute float aSize;
varying float vAlpha;
varying float vMix;
varying float vWarm;
${NOISE}
void main() {
  float t = uTime;
  float r = aRand;

  // Formation morph chain across uStage 0..4 — never fading, always becoming.
  float s0 = smoothstep(0.0, 1.0, clamp(uStage, 0.0, 1.0));
  float s1 = smoothstep(1.0, 2.0, clamp(uStage, 1.0, 2.0));
  float s2 = smoothstep(2.0, 3.0, clamp(uStage, 2.0, 3.0));
  float s3 = smoothstep(3.0, 4.0, clamp(uStage, 3.0, 4.0));
  vec3 pos = position;
  pos = mix(pos, aF1, s0);
  pos = mix(pos, aF2, s1 * (0.75 + 0.25 * r));
  pos = mix(pos, aF3, s2);
  pos = mix(pos, aF4, s3);

  // Orbital drift inside the bulb (stage ~0): a patient inner cosmos.
  float inBulb = 1.0 - s0;
  float ang = t * (0.22 + r * 0.35) + r * 6.2831;
  float ca = cos(ang), sa = sin(ang);
  pos.xz = mix(pos.xz, mat2(ca, -sa, sa, ca) * position.xz, inBulb);

  // Living drift — amplitude relaxes as the idea finds architecture.
  float amp = mix(0.024, 0.030, smoothstep(2.0, 3.2, uStage));
  pos.x += snoise(vec3(r * 40.0, t * 0.16, 0.0)) * amp;
  pos.y += snoise(vec3(0.0, r * 40.0, t * 0.14)) * amp;
  pos.z += snoise(vec3(t * 0.15, 0.0, r * 40.0)) * amp;

  // Keep the inner cosmos aligned with the glass as it drifts and breathes.
  pos *= mix(1.0, uBulbScale, inBulb);
  pos += uBulbOffset * inBulb;

  // Cursor field — nearby particles lean toward attention.
  vec2 puv = uPointer * 3.2;
  float d = length(pos.xy - puv);
  float pull = (1.0 - smoothstep(0.0, 1.5, d)) * (0.025 + uEnergy * 0.06);
  pos.xy += normalize(puv - pos.xy + 0.0001) * pull;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float twinkle = 0.72 + 0.28 * sin(t * (0.9 + r * 2.2) + r * 40.0);
  float stageFade = mix(1.0, 0.92, s3);
  float innerExposure = mix(0.10, 1.0, s0);
  vAlpha = twinkle * stageFade * innerExposure * (1.0 - uDim * 0.72) * uIntro;
  vMix = r;
  vWarm = smoothstep(2.2, 4.0, uStage);

  float size = aSize * mix(0.45, 1.0, s0) * (1.0 + uEnergy * 0.16 * inBulb);
  gl_PointSize = size * uPixelRatio * (15.0 / -mv.z);
}
`;

export const PARTICLE_FRAG = /* glsl */ `
precision highp float;
uniform float uDim;
varying float vAlpha;
varying float vMix;
varying float vWarm;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  float heart = smoothstep(0.16, 0.0, d);

  vec3 violet    = vec3(0.635, 0.502, 1.0);
  vec3 light     = vec3(0.988, 0.988, 0.968);
  vec3 champagne = vec3(0.955, 0.835, 0.658);

  vec3 col = mix(violet, light, step(0.55, vMix));
  col = mix(col, champagne, vWarm * 0.45 * (1.0 - step(0.72, vMix)));
  col = mix(col, light, heart * 0.85);

  float a = core * vAlpha;
  gl_FragColor = vec4(col * (1.1 + heart * 1.4), a);
}
`;

/* ------------------------------------------------------------------ */
/* Filament — the living thread at the heart of the bulb              */
/* ------------------------------------------------------------------ */

export const FILAMENT_VERT = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying vec3 vPos;
void main() {
  vUv = uv;
  vPos = position;
  vec3 pos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const FILAMENT_FRAG = /* glsl */ `
uniform float uTime;
uniform float uEnergy;
uniform float uWarm;
uniform float uBulb;
varying vec2 vUv;
varying vec3 vPos;
void main() {
  float pulse = 0.80 + 0.20 * sin(uTime * 1.7 + vUv.x * 8.0);
  float current = 0.5 + 0.5 * sin(vUv.x * 16.0 - uTime * 3.2);
  current = smoothstep(0.45, 0.95, current);
  vec3 champagne = vec3(0.97, 0.78, 0.52);
  vec3 violet = vec3(0.68, 0.54, 0.94);
  vec3 col = mix(champagne, violet, clamp(0.22 + uEnergy * 0.25 - uWarm * 0.15, 0.0, 1.0));
  float glow = (0.48 * pulse + current * (0.14 + uEnergy * 0.24)) * uBulb;
  gl_FragColor = vec4(col * glow, min(0.9, glow));
}
`;

/* ------------------------------------------------------------------ */
/* Energy pulse travelling through the lattice rings                  */
/* ------------------------------------------------------------------ */

export const NODE_VERT = /* glsl */ `
attribute float aPhase;
varying float vPhase;
varying vec3 vN;
varying vec3 vW;
void main() {
  vPhase = aPhase;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const NODE_FRAG = /* glsl */ `
uniform float uTime;
uniform float uFlow;
uniform float uWarm;
uniform float uIntro;
uniform float uBoost;
uniform float uPhase;
varying float vPhase;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - abs(dot(normalize(vN), V)), 2.0);
  float wave = 0.5 + 0.5 * sin(uTime * 2.2 - vPhase * 2.4 + uPhase);
  wave = smoothstep(0.35, 0.95, wave);
  vec3 violet = vec3(0.494, 0.435, 0.941);
  vec3 champagne = vec3(0.894, 0.765, 0.565);
  vec3 base = mix(violet, champagne, uWarm * 0.7);
  float glow = (0.32 + fres * 0.9 + wave * (0.6 + uFlow * 1.4) * uBoost) * uIntro;
  gl_FragColor = vec4(base * glow, min(1.0, glow));
}
`;
