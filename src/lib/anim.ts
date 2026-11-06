import {Easing, interpolate} from 'remotion';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** interpolate with clamping and optional easing */
export const tween = (
  frame: number,
  input: number[],
  output: number[],
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
) => interpolate(frame, input, output, {...clamp, easing});

export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const backOut = Easing.out(Easing.back(1.8));

/** smooth pseudo-random wobble, deterministic per frame */
export const wobble = (frame: number, seed = 0, speed = 1) =>
  Math.sin(frame * 0.071 * speed + seed * 12.9898) * 0.5 +
  Math.sin(frame * 0.137 * speed + seed * 78.233) * 0.3 +
  Math.sin(frame * 0.291 * speed + seed * 37.719) * 0.2;

/** camera shake that decays after a hit at `at` */
export const shake = (frame: number, at: number, strength = 20, decay = 12, seed = 1) => {
  if (frame < at) return 0;
  const t = frame - at;
  return Math.sin(t * 2.7 + seed) * strength * Math.exp(-t / decay);
};

/** automatic blinking: returns 0..1 eye openness */
export const blink = (frame: number, offset = 0, every = 87) => {
  const f = (frame + offset) % every;
  if (f < 3) return 1 - f / 3;
  if (f < 6) return (f - 3) / 3;
  return 1;
};
