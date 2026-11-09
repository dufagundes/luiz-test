// Small, dependency-free animation helpers. All functions are pure (same input -> same frame).
export type V3 = [number, number, number];

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale3 = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);

export const ease = {
  linear: (t: number) => t,
  in: (t: number) => t * t,
  out: (t: number) => 1 - (1 - t) * (1 - t),
  inOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t: number) => {
    const c1 = 1.9;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outElastic: (t: number) =>
    t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
};
export type Ease = (t: number) => number;

/** 0..1 progress of t through [t0, t1], eased */
export const seg = (t: number, t0: number, t1: number, e: Ease = ease.inOut) => e(clamp((t - t0) / (t1 - t0)));

/** piecewise keyframes [[time, value], ...] with per-segment easing */
export function keys(t: number, k: [number, number][], e: Ease = ease.inOut): number {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    if (t <= k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], e(clamp((t - k[i][0]) / (k[i + 1][0] - k[i][0]))));
  }
  return k[k.length - 1][1];
}
export function keysV(t: number, k: [number, V3][], e: Ease = ease.inOut): V3 {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    if (t <= k[i + 1][0]) return mix3(k[i][1], k[i + 1][1], e(clamp((t - k[i][0]) / (k[i + 1][0] - k[i][0]))));
  }
  return k[k.length - 1][1];
}

/** 0..1 travel with constant speed in the middle and smooth acceleration at both ends */
export function travel(t: number, t0: number, t1: number, acc = 0.2): number {
  const p = clamp((t - t0) / (t1 - t0));
  const a = clamp(acc, 0.0001, 0.5);
  const vmax = 1 / (1 - a); // area under trapezoid = 1
  if (p < a) return (0.5 * vmax * p * p) / a;
  if (p > 1 - a) return 1 - (0.5 * vmax * (1 - p) * (1 - p)) / a;
  return 0.5 * vmax * a + vmax * (p - a);
}

/** smooth deterministic 1D noise in [-1, 1] */
export function noise(t: number, seed = 0): number {
  const h = (n: number) => {
    const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u);
}

/** pulse that rises quickly at t0 and decays (for shakes, flashes) */
export const hit = (t: number, t0: number, decay = 0.25) => (t < t0 ? 0 : Math.exp(-(t - t0) / decay));

/** position along a polyline: returns point, travelled distance and heading yaw */
export function along(pts: V3[], d: number): {pos: V3; yaw: number} {
  let rest = Math.max(0, d);
  for (let i = 0; i < pts.length - 1; i++) {
    const s = sub3(pts[i + 1], pts[i]);
    const L = len3(s);
    if (rest <= L || i === pts.length - 2) {
      const f = L > 0 ? clamp(rest / L) : 0;
      return {pos: add3(pts[i], scale3(s, f)), yaw: Math.atan2(s[0], s[2])};
    }
    rest -= L;
  }
  return {pos: pts[pts.length - 1], yaw: 0};
}
export const pathLength = (pts: V3[]) => pts.slice(1).reduce((a, p, i) => a + len3(sub3(p, pts[i])), 0);

/** forward (+Z local) and right vectors for a yaw */
export const fwd = (yaw: number): V3 => [Math.sin(yaw), 0, Math.cos(yaw)];
export const right = (yaw: number): V3 => [-Math.cos(yaw), 0, Math.sin(yaw)];
/** cow/cart local offset -> world */
export const localToWorld = (pos: V3, yaw: number, l: V3): V3 => [
  pos[0] + l[0] * Math.cos(yaw) + l[2] * Math.sin(yaw),
  pos[1] + l[1],
  pos[2] - l[0] * Math.sin(yaw) + l[2] * Math.cos(yaw),
];
