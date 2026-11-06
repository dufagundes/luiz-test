import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import timeline from '../timeline.json';
import {FPS} from '../lib/constants';

type Word = {w: string; start: number; end: number};
type Line = {id: string; voice: string; text: string; start: number; end: number; words: Word[]};

type Chunk = {words: Word[]; start: number; end: number; voice: string};

/** Split each spoken line into short, punchy 1–3 word caption chunks. */
const buildChunks = (): Chunk[] => {
  const chunks: Chunk[] = [];
  for (const line of timeline as Line[]) {
    let cur: Word[] = [];
    const flush = () => {
      if (cur.length) chunks.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end, voice: line.voice});
      cur = [];
    };
    for (const w of line.words) {
      cur.push(w);
      const strongBreak = /[.…?:,”]$/.test(w.w);
      if (strongBreak || cur.length >= 3) flush();
    }
    flush();
  }
  // each chunk stays until the next one starts (or a short hold after its last word)
  return chunks.map((c, i) => {
    const next = chunks[i + 1];
    const hold = c.end + 10;
    return {...c, end: next ? Math.min(next.start, hold) : hold};
  });
};

const CHUNKS = buildChunks();

const STYLE: Record<string, {color: string; active: string; italic: boolean}> = {
  ryan: {color: '#ffffff', active: '#ffd84d', italic: false},
  fake: {color: '#ffd0d4', active: '#ff3b4e', italic: true},
  mom: {color: '#ffe9cf', active: '#ffb866', italic: true},
};

export const Subtitles: React.FC<{hideAfter?: number}> = ({hideAfter = 99999}) => {
  const frame = useCurrentFrame();
  if (frame >= hideAfter) return null;
  const chunk = CHUNKS.find((c) => frame >= c.start - 2 && frame < c.end);
  if (!chunk) return null;
  const st = STYLE[chunk.voice] ?? STYLE.ryan;
  const pop = spring({frame: frame - chunk.start + 2, fps: FPS, config: {damping: 11, stiffness: 220, mass: 0.5}});
  const scale = 0.6 + 0.4 * pop;
  const rot = (chunk.start % 2 === 0 ? -1 : 1) * 1.5 * (1 - pop);

  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: 1300,
          width: 960,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0 34px',
          transform: `scale(${scale}) rotate(${rot}deg)`,
          opacity: Math.min(1, pop * 2),
        }}
      >
        {chunk.words.map((w, i) => {
          const active = frame >= w.start && frame < w.end + 2;
          const said = frame >= w.start;
          const wordPop = active ? 1 + 0.08 * spring({frame: frame - w.start, fps: FPS, config: {damping: 8}}) : 1;
          return (
            <span
              key={i}
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontStyle: st.italic ? 'italic' : 'normal',
                fontSize: 92,
                lineHeight: 1.12,
                textTransform: 'uppercase',
                letterSpacing: -1,
                color: active ? st.active : st.color,
                opacity: said ? 1 : 0.55,
                WebkitTextStroke: '14px #000',
                paintOrder: 'stroke fill',
                textShadow: '0 8px 0 rgba(0,0,0,0.55), 0 0 40px rgba(0,0,0,0.6)',
                display: 'inline-block',
                padding: '0 4px',
                transform: `scale(${wordPop})`,
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
