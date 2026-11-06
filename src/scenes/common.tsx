import React from 'react';
import timeline from '../timeline.json';

/** Soft colored light (screen blend) — used for phone glow on faces, warm hall light, etc. */
export const Light: React.FC<{x: number; y: number; r: number; color?: 'phone' | 'warm' | 'red' | 'moon'; opacity?: number}> = ({
  x,
  y,
  r,
  color = 'phone',
  opacity = 1,
}) => {
  const id = {phone: 'phoneGlow', warm: 'warmGlow', red: 'redGlow', moon: 'moonGlow'}[color];
  return opacity > 0 ? <circle cx={x} cy={y} r={r} fill={`url(#${id})`} opacity={opacity} style={{mixBlendMode: 'screen'}} /> : null;
};

/** Floating dust motes drifting through a light beam */
export const Dust: React.FC<{frame: number; x: number; y: number; w: number; h: number; n?: number; color?: string; fall?: number}> = ({
  frame,
  x,
  y,
  w,
  h,
  n = 26,
  color = '#cfe3ff',
  fall = 0.3,
}) => (
  <g style={{mixBlendMode: 'screen'}}>
    {[...Array(n)].map((_, i) => {
      const px = x + ((i * 137.5 + Math.sin(frame * 0.02 + i) * 30) % w);
      const py = y + ((i * 91.3 + frame * fall * (1 + (i % 3) * 0.4)) % h);
      return <circle key={i} cx={px} cy={py} r={2 + (i % 3)} fill={color} opacity={0.15 + 0.35 * Math.abs(Math.sin(frame * 0.05 + i * 1.7))} />;
    })}
  </g>
);

type Line = {id: string; words: {w: string; start: number; end: number}[]};

/** 0..1 mouth openness for a character voice line at a given global frame (lip-sync) */
export const speak = (globalFrame: number, lineId: string) => {
  const line = (timeline as Line[]).find((l) => l.id === lineId);
  if (!line) return 0;
  const w = line.words.find((wd) => globalFrame >= wd.start && globalFrame < wd.end - 1);
  if (!w) return 0;
  return 0.25 + 0.75 * Math.abs(Math.sin((globalFrame - w.start) * 0.85));
};
