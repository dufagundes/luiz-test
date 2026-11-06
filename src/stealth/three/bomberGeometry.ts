import * as THREE from 'three';

/**
 * Procedural flying-wing bomber (original model, stylised after the general layout of
 * a B-2–type aircraft). Units: semi-span S = 4  (full span 8 units).
 *
 * Coordinates: +Z = nose direction, X = span, Y = up.
 * Chordwise position xc is measured backwards from the nose apex in units of S.
 */
export const S = 4;
const SWEEP = 0.65; // tan(~33°) leading-edge sweep

/** leading edge (xc) at span fraction u (0 = centre, 1 = tip) */
export const xle = (u: number) => SWEEP * Math.sqrt(u * u + 0.0009) - SWEEP * 0.03;

/** Double-"W" sawtooth trailing edge. Every segment is parallel to one of the two leading edges. */
const TE: [number, number][] = [
  [0, 0.74],
  [0.15, 0.6425],
  [0.3, 0.74],
  [0.55, 0.5775],
  [1, 0.8675],
];
export const xte = (u: number) => {
  for (let i = 0; i < TE.length - 1; i++) {
    const [u0, x0] = TE[i];
    const [u1, x1] = TE[i + 1];
    if (u <= u1) return x0 + ((u - u0) / (u1 - u0)) * (x1 - x0);
  }
  return TE[TE.length - 1][1];
};
export const TE_BREAKS = TE.map((p) => p[0]);

/** thickness ratio: deep centre body blending into a thin outer wing */
const tc = (u: number) => 0.07 + 0.09 * Math.exp(-Math.pow(u / 0.16, 2));

const naca = (s: number, t: number) =>
  5 * t * (0.2969 * Math.sqrt(s) - 0.126 * s - 0.3516 * s * s + 0.2843 * s * s * s - 0.1036 * s * s * s * s);

/** height bumps on the upper surface: cockpit hump + two engine-intake humps */
const upperBumps = (u: number, s: number, chord: number) => {
  const au = Math.abs(u);
  const cockpit = 0.028 * Math.exp(-Math.pow(au / 0.07, 2)) * Math.exp(-Math.pow((s - 0.22) / 0.16, 2));
  const intake = 0.016 * Math.exp(-Math.pow((au - 0.13) / 0.04, 2)) * Math.exp(-Math.pow((s - 0.36) / 0.12, 2));
  return (cockpit + intake) / Math.max(chord, 0.2);
};

/** Point on the skin. side: +1 upper, -1 lower. u in [-1, 1], s in [0, 1] chordwise. */
export const skin = (u: number, s: number, side: 1 | -1): THREE.Vector3 => {
  const au = Math.min(1, Math.abs(u));
  const le = xle(au);
  const te = xte(au);
  const chord = te - le;
  const t = tc(au);
  const yt = naca(s, t);
  // tip rounding: thin the last 3 % of span
  const tipK = 1 - 0.75 * Math.pow(Math.max(0, (au - 0.97) / 0.03), 2);
  let y = side > 0 ? yt * 1.25 + upperBumps(au, s, chord) * chord * 2.2 : -yt * 0.72;
  // slight wash-out (outer wing a hair lower) gives a natural droop
  y = y * tipK * chord - 0.012 * au * au;
  const xc = le + s * chord;
  return new THREE.Vector3(u * S, y * S, (0.38 - xc) * S);
};

const stationList = () => {
  const set = new Set<number>();
  for (let u = 0; u <= 1.0001; u += 0.0125) set.add(+u.toFixed(4));
  for (const b of TE_BREAKS) {
    set.add(b);
    set.add(Math.max(0, +(b - 0.004).toFixed(4)));
    set.add(Math.min(1, +(b + 0.004).toFixed(4)));
  }
  const pos = [...set].sort((a, b) => a - b);
  return [...pos.slice(1).map((x) => -x).reverse(), ...pos];
};

const chordSamples = (M: number) => {
  const out: number[] = [];
  for (let k = 0; k < M; k++) out.push((1 - Math.cos((Math.PI * k) / (M - 1))) / 2);
  return out;
};

/** The main wing/body skin as one closed, smooth mesh. */
export const buildSkin = () => {
  const us = stationList();
  const ss = chordSamples(46);
  // loop: TE upper -> LE -> TE lower (LE and TE shared once)
  const loop: [number, 1 | -1][] = [];
  for (let k = ss.length - 1; k >= 0; k--) loop.push([ss[k], 1]);
  for (let k = 1; k < ss.length - 1; k++) loop.push([ss[k], -1]);
  const P = loop.length;
  const pos: number[] = [];
  const uvs: number[] = [];
  for (const u of us) {
    for (const [s, side] of loop) {
      const v = skin(u, s, side);
      pos.push(v.x, v.y, v.z);
      uvs.push(u * 0.5 + 0.5, side > 0 ? s * 0.5 : 1 - s * 0.5);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < us.length - 1; i++) {
    for (let k = 0; k < P; k++) {
      const a = i * P + k;
      const b = i * P + ((k + 1) % P);
      const c = (i + 1) * P + k;
      const d = (i + 1) * P + ((k + 1) % P);
      idx.push(a, c, b, b, c, d);
    }
  }
  // tip caps
  for (const [i, flip] of [
    [0, true],
    [us.length - 1, false],
  ] as [number, boolean][]) {
    const base = i * P;
    for (let k = 1; k < P / 2; k++) {
      const a = base + k;
      const b = base + k + 1;
      const c = base + ((P - k) % P);
      const d = base + ((P - k - 1 + P) % P);
      if (flip) idx.push(a, b, c, b, d, c);
      else idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

/** A small patch that hugs the skin (windows, intakes, exhaust decks, door panels). */
export const buildPatch = (u0: number, u1: number, s0: number, s1: number, side: 1 | -1, lift = 0.006, nu = 10, ns = 10) => {
  const pos: number[] = [];
  const uvs: number[] = [];
  for (let i = 0; i <= nu; i++) {
    for (let j = 0; j <= ns; j++) {
      const u = u0 + ((u1 - u0) * i) / nu;
      const s = s0 + ((s1 - s0) * j) / ns;
      const v = skin(u, s, side);
      v.y += lift * side;
      pos.push(v.x, v.y, v.z);
      uvs.push(i / nu, j / ns);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < ns; j++) {
      const a = i * (ns + 1) + j;
      const b = a + 1;
      const c = a + ns + 1;
      const d = c + 1;
      if (side > 0) idx.push(a, b, c, b, d, c);
      else idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

/** Edge lines of the planform (for the geometry-alignment diagram). */
export const planformOutline = (): THREE.Vector3[] => {
  const pts: THREE.Vector3[] = [];
  const top = (u: number, s: number) => {
    const v = skin(u, s, 1);
    return new THREE.Vector3(v.x, 0, v.z);
  };
  pts.push(top(-1, 0));
  pts.push(top(0, 0));
  pts.push(top(1, 0));
  for (const b of [...TE_BREAKS].reverse()) pts.push(top(b, 1));
  for (const b of TE_BREAKS.slice(1)) pts.push(top(-b, 1));
  return pts;
};
