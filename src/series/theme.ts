/** THE LAST SIGNAL: series-wide art direction. Reuse these everywhere for a consistent look. */
export const T = {
  // night palette
  sky0: '#05070f',
  sky1: '#121a33',
  sky2: '#25264a',
  hill: '#0b0f1e',
  houseFar: '#121729',
  houseMid: '#171d33',
  houseNear: '#1d2440',
  roof: '#0e1222',
  // attic
  atticWall: '#2a2a44',
  atticWallDark: '#1d1e33',
  atticBeam: '#3a3150',
  wood: '#3a2c2a',
  woodLight: '#4d3a34',
  floor: '#241c22',
  // light colors
  phone: '#7fd4ff',
  warm: '#ffbe6e',
  signalRed: '#ff3348',
  signalWhite: '#e9f4ff',
  amber: '#ffb347',
  // UI
  uiRed: '#ff2e4d',
  uiBlue: '#3aa0ff',
  uiText: '#f2f4fb',
  font: "'Montserrat', 'Segoe UI', Arial, sans-serif",
  mono: "'Courier New', monospace",
};

/** deterministic pseudo-random generator (so towns/houses look the same every render & chapter) */
export const seeded = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
