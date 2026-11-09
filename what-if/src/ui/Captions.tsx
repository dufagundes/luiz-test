import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ease, seg} from '../lib/anim';
import {SAFE, UI_FONT} from './Overlays';

export interface Chunk {
  text: string;
  start: number;
  end: number;
  words: {w: string; start: number; end: number}[];
}

/** big, phone-legible captions; the spoken word is highlighted. Sits above the bottom UI safe zone. */
export const Captions: React.FC<{t: number; chunks: Chunk[]}> = ({t, chunks}) => {
  const c = chunks.find((x) => t >= x.start - 0.05 && t < x.end + 0.25);
  if (!c) return null;
  const pop = seg(t, c.start - 0.05, c.start + 0.12, ease.outBack);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: SAFE.bottom + 40, paddingLeft: SAFE.side, paddingRight: SAFE.right}}>
      <div style={{
        textAlign: 'center', fontFamily: UI_FONT, fontWeight: 800, fontSize: 84, lineHeight: 1.08, color: '#ffffff',
        transform: `scale(${0.85 + 0.15 * pop})`, maxWidth: 1080 - SAFE.side - SAFE.right,
        textShadow: '#1b1b2f 0 6px 0, #1b1b2f 6px 0 0, #1b1b2f 0 -6px 0, #1b1b2f -6px 0 0, #1b1b2f 4px 4px 0, #1b1b2f -4px 4px 0, #1b1b2f 4px -4px 0, #1b1b2f -4px -4px 0, rgba(0,0,0,0.4) 0 10px 10px',
      }}>
        {c.words.map((w, i) => {
          const on = t >= w.start - 0.03;
          const now = t >= w.start - 0.03 && t < w.end;
          return (
            <span key={i} style={{color: now ? '#ffd21f' : '#ffffff', opacity: on ? 1 : 0.55, display: 'inline-block', transform: `scale(${now ? 1.08 : 1})`, margin: '0 10px'}}>
              {w.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
