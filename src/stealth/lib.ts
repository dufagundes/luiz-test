import * as THREE from 'three';
import timeline from './timeline.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const TL = timeline;
export const DURATION_FRAMES = timeline.durationInFrames;

export type LineId = 'hook' | 'radar' | 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'together' | 'outro';
export const SCENES: LineId[] = timeline.lines.map((l) => l.id as LineId);

/** Frame where each scene starts (scene i is driven by narration line i). */
export const sceneStartFrame = (i: number) => Math.round(timeline.cuts[i] * FPS);
export const sceneRange = (id: LineId) => {
  const i = SCENES.indexOf(id);
  const from = sceneStartFrame(i);
  const to = i + 1 < SCENES.length ? sceneStartFrame(i + 1) : DURATION_FRAMES;
  return {from, dur: to - from};
};

const lineById = (id: LineId) => timeline.lines.find((l) => l.id === id)!;

/** Seconds (relative to the scene start) when chunk `k` of a line starts being spoken. */
export const beat = (id: LineId, k = 0) => {
  const i = SCENES.indexOf(id);
  const c = lineById(id).chunks[Math.min(k, lineById(id).chunks.length - 1)];
  return c.start - timeline.cuts[i];
};
/** Seconds (relative to scene start) when the line's narration ends. */
export const lineEnd = (id: LineId) => lineById(id).end - timeline.cuts[SCENES.indexOf(id)];

// ---------------------------------------------------------------- easing / animation
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const easeInOut = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
/** 0→1 over [a, b] seconds, smoothed */
export const ramp = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
/** a pop that overshoots slightly (for labels / UI) */
export const pop = (t: number, a: number, d = 0.35) => {
  const x = clamp((t - a) / d);
  if (x <= 0) return 0;
  const c1 = 1.70158 * 1.2;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
export type V3 = [number, number, number];
export const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------------------------------------------------------- camera
export type Cam = {pos: V3; target: V3; fov: number; roll?: number};

const _cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 3000);
const _v = new THREE.Vector3();
const prep = (c: Cam) => {
  _cam.fov = c.fov;
  _cam.aspect = W / H;
  _cam.position.set(...c.pos);
  _cam.up.set(Math.sin(c.roll ?? 0), Math.cos(c.roll ?? 0), 0);
  _cam.lookAt(...c.target);
  _cam.updateProjectionMatrix();
  _cam.updateMatrixWorld();
};
/** Project a world point to screen pixels (1080×1920). Used to pin 2D labels to 3D objects. */
export const project = (c: Cam, p: V3) => {
  prep(c);
  _v.set(...p).project(_cam);
  return {x: (_v.x * 0.5 + 0.5) * W, y: (-_v.y * 0.5 + 0.5) * H, visible: _v.z < 1};
};

/** Orbit helper: camera on a sphere around a target. az/el in radians. */
export const orbit = (target: V3, dist: number, az: number, el: number): V3 => [
  target[0] + dist * Math.cos(el) * Math.sin(az),
  target[1] + dist * Math.sin(el),
  target[2] + dist * Math.cos(el) * Math.cos(az),
];

// ---------------------------------------------------------------- palette
export const C = {
  accent: '#FFD400',
  cyan: '#38E1FF',
  green: '#3DFF8B',
  red: '#FF3B4E',
  orange: '#FF8A1F',
  ink: '#0A0F18',
  panel: 'rgba(8,14,24,0.72)',
};
export const FONT = 'Montserrat, Arial Black, sans-serif';
