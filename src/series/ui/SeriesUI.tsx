import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import {T} from '../theme';
import {clamp} from '../../lib/anim';
import {interpolate} from 'remotion';

export type TimelineWord = {w: string; start: number; end: number};
export type TimelineLine = {id: string; voice: string; text: string; start: number; end: number; noSubs?: boolean; words: TimelineWord[]};
export type Timeline = {durationInFrames: number; lines: TimelineLine[]};

const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);

/* ---------------------------------------------------------------- subtitles */
const VOICE_STYLE: Record<string, {color: string; active: string; italic: boolean; tag?: string}> = {
  narrator: {color: '#ffffff', active: '#ffd84d', italic: false},
  nora: {color: '#fff2c9', active: '#f2c230', italic: true, tag: 'NORA'},
  radio: {color: '#ffd0d6', active: T.uiRed, italic: true, tag: 'THE RADIO'},
  theo: {color: '#e3f5d4', active: '#9ad16a', italic: true, tag: 'THEO'},
  milo: {color: '#dfe6ff', active: '#8fb0ff', italic: true, tag: 'MILO'},
  echo: {color: '#e3f5d4', active: '#7fd4ff', italic: true, tag: 'TEXT FROM THEO'},
  echo_live: {color: '#e3f5d4', active: '#7fd4ff', italic: true, tag: 'THE OTHER THEO'},
};

type Chunk = {words: TimelineWord[]; start: number; end: number; voice: string};

export const buildChunks = (tl: Timeline): Chunk[] => {
  const chunks: Chunk[] = [];
  for (const line of tl.lines) {
    if (line.noSubs) continue;
    let cur: TimelineWord[] = [];
    const flush = () => {
      if (cur.length) chunks.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end, voice: line.voice});
      cur = [];
    };
    for (const w of line.words) {
      cur.push(w);
      if (/[.…?!:,”]$/.test(w.w) || cur.length >= 3) flush();
    }
    flush();
  }
  return chunks.map((c, i) => {
    const next = chunks[i + 1];
    return {...c, end: next ? Math.min(next.start, c.end + 10) : c.end + 10};
  });
};

export const SeriesSubtitles: React.FC<{timeline: Timeline; top?: number}> = ({timeline, top = 1330}) => {
  const frame = useCurrentFrame();
  const chunks = React.useMemo(() => buildChunks(timeline), [timeline]);
  const chunk = chunks.find((c) => frame >= c.start - 2 && frame < c.end);
  if (!chunk) return null;
  const st = VOICE_STYLE[chunk.voice] ?? VOICE_STYLE.narrator;
  const pop = spring({frame: frame - chunk.start + 2, fps: 30, config: {damping: 11, stiffness: 220, mass: 0.5}});
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top, left: 60, right: 60, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {st.tag ? (
          <div
            style={{
              fontFamily: T.font,
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: 6,
              color: st.active,
              background: 'rgba(0,0,0,0.55)',
              padding: '6px 18px',
              borderRadius: 10,
              marginBottom: 12,
              opacity: Math.min(1, pop * 2),
            }}
          >
            {st.tag}
          </div>
        ) : null}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0 30px',
            transform: `scale(${0.6 + 0.4 * pop})`,
            opacity: Math.min(1, pop * 2),
          }}
        >
          {chunk.words.map((w, i) => {
            const active = frame >= w.start && frame < w.end + 2;
            return (
              <span
                key={i}
                style={{
                  fontFamily: T.font,
                  fontWeight: 900,
                  fontStyle: st.italic ? 'italic' : 'normal',
                  fontSize: 88,
                  lineHeight: 1.12,
                  textTransform: 'uppercase',
                  color: active ? st.active : st.color,
                  opacity: frame >= w.start ? 1 : 0.55,
                  WebkitTextStroke: '14px #000',
                  paintOrder: 'stroke fill',
                  textShadow: '0 8px 0 rgba(0,0,0,0.55), 0 0 40px rgba(0,0,0,0.6)',
                  display: 'inline-block',
                  padding: '0 4px',
                  transform: `scale(${active ? 1.07 : 1})`,
                }}
              >
                {w.w}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- 24h countdown */
/** Series HUD: time left until the deadline. startClock = seconds already elapsed at frame `zeroFrame`. */
export const Countdown: React.FC<{zeroFrame: number; elapsedAtZero?: number; show?: number; urgent?: boolean}> = ({zeroFrame, elapsedAtZero = 0, show = 1, urgent = false}) => {
  const frame = useCurrentFrame();
  if (show <= 0) return null;
  const elapsed = Math.max(0, elapsedAtZero + (frame - zeroFrame) / 30);
  const left = Math.max(0, 24 * 3600 - elapsed);
  const hh = Math.floor(left / 3600);
  const mm = Math.floor((left % 3600) / 60);
  const ss = Math.floor(left % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  const blink = urgent && frame % 30 < 15;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: show}}>
      <div
        style={{
          position: 'absolute',
          top: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          background: 'rgba(5,6,12,0.72)',
          border: `3px solid ${T.uiRed}`,
          borderRadius: 18,
          padding: '10px 26px',
          boxShadow: `0 0 30px rgba(255,46,77,${blink ? 0.6 : 0.25})`,
        }}
      >
        <div style={{width: 18, height: 18, borderRadius: 9, background: T.uiRed, opacity: frame % 30 < 15 ? 1 : 0.3}} />
        <div style={{fontFamily: T.mono, fontWeight: 700, fontSize: 52, color: '#fff', letterSpacing: 2}}>
          {pad(hh)}:{pad(mm)}:{pad(ss)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- series logo + chapter title */
export const SeriesLogo: React.FC<{size?: number; glitch?: boolean}> = ({size = 1, glitch = false}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${size})`}}>
    <svg width={120} height={70} viewBox="0 0 120 70">
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${40 - i * 14} ${60 - i * 6} A ${22 + i * 16} ${22 + i * 16} 0 0 1 ${80 + i * 14} ${60 - i * 6}`} stroke={T.uiRed} strokeWidth={6} fill="none" opacity={1 - i * 0.25} />
      ))}
      <circle cx={60} cy={60} r={7} fill={T.uiRed} />
    </svg>
    <div
      style={{
        fontFamily: T.font,
        fontWeight: 900,
        fontSize: 92,
        letterSpacing: 6,
        color: T.uiText,
        lineHeight: 1,
        textShadow: glitch ? `-7px 0 ${T.uiRed}, 7px 0 #4fd1ff` : '0 0 30px rgba(255,46,77,0.35)',
      }}
    >
      THE LAST
    </div>
    <div style={{fontFamily: T.font, fontWeight: 900, fontSize: 120, letterSpacing: 14, color: T.uiRed, lineHeight: 1.05}}>SIGNAL</div>
  </div>
);

export const ChapterTitle: React.FC<{at: number; chapter: number; title: string; hold?: number}> = ({at, chapter, title, hold = 75}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > hold + 12) return null;
  const inn = spring({frame: t, fps: 30, config: {damping: 14}});
  const out = ease(t, hold, hold + 12);
  const glitch = t < 5 || (t > 30 && t < 33);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 1 - out}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 20%, rgba(0,0,0,0) 70%)'}} />
      <div style={{transform: `scale(${0.85 + inn * 0.15}) translateY(-120px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
        <SeriesLogo glitch={glitch} />
        <div style={{fontFamily: T.font, fontWeight: 800, fontSize: 40, letterSpacing: 10, color: '#c9cfe6', opacity: ease(t, 10, 22)}}>
          CHAPTER {chapter} · {title}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- the decision screen */
export type Choice = {question: string; a: string; b: string; aIcon?: React.ReactNode; bIcon?: React.ReactNode};

export const ChoiceCard: React.FC<{
  at: number;
  aAt: number;
  bAt: number;
  ctaAt: number;
  voteAt: number;
  choice: Choice;
  chapter: number;
  ctaText?: string;
}> = ({at, aAt, bAt, ctaAt, voteAt, choice, chapter, ctaText = 'YOU DECIDE WHAT HAPPENS NEXT!'}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const t = frame - at;
  const bg = ease(t, 0, 10);
  const q = spring({frame: t - 4, fps: 30, config: {damping: 12}});
  const pa = spring({frame: frame - aAt, fps: 30, config: {damping: 11, stiffness: 160}});
  const pb = spring({frame: frame - bAt, fps: 30, config: {damping: 11, stiffness: 160}});
  const pc = spring({frame: frame - ctaAt, fps: 30, config: {damping: 9, stiffness: 180}});
  const pv = spring({frame: frame - voteAt, fps: 30, config: {damping: 12}});
  const pulse = 1 + 0.035 * Math.sin(frame * 0.25);

  const option = (letter: 'A' | 'B', text: string, p: number, color: string, icon?: React.ReactNode) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 30,
        width: 900,
        padding: '26px 34px',
        borderRadius: 34,
        background: 'rgba(14,16,28,0.92)',
        border: `5px solid ${color}`,
        boxShadow: `0 0 40px ${color}55`,
        transform: `translateX(${(1 - p) * (letter === 'A' ? -700 : 700)}px)`,
        opacity: Math.min(1, p * 1.5),
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 30,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: T.font,
          fontWeight: 900,
          fontSize: 84,
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {letter}
      </div>
      <div style={{fontFamily: T.font, fontWeight: 900, fontSize: 62, lineHeight: 1.05, color: '#fff', textTransform: 'uppercase', flex: 1}}>{text}</div>
      {icon ? <div style={{width: 150, height: 150, flexShrink: 0}}>{icon}</div> : null}
    </div>
  );

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: `rgba(3,4,10,${0.82 * bg})`, backdropFilter: `blur(${10 * bg}px)`}} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 210, gap: 40, display: 'flex', flexDirection: 'column'}}>
        <div style={{fontFamily: T.font, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: T.uiRed, opacity: bg}}>THE LAST SIGNAL · CHAPTER {chapter}</div>
        <div
          style={{
            fontFamily: T.font,
            fontWeight: 900,
            fontSize: 84,
            lineHeight: 1.08,
            textAlign: 'center',
            color: '#fff',
            width: 960,
            textTransform: 'uppercase',
            transform: `scale(${0.7 + 0.3 * q})`,
            opacity: Math.min(1, q * 1.5),
            textShadow: '0 6px 0 rgba(0,0,0,0.6)',
          }}
        >
          {choice.question}
        </div>
        <div style={{height: 10}} />
        {option('A', choice.a, pa, T.uiBlue, choice.aIcon)}
        {option('B', choice.b, pb, T.uiRed, choice.bIcon)}
        <div style={{height: 20}} />
        <div
          style={{
            fontFamily: T.font,
            fontWeight: 900,
            fontSize: 66,
            textAlign: 'center',
            color: '#ffd84d',
            width: 980,
            lineHeight: 1.1,
            transform: `scale(${(0.6 + 0.4 * pc) * (frame > ctaAt + 15 ? pulse : 1)})`,
            opacity: Math.min(1, pc * 1.5),
            WebkitTextStroke: '10px #000',
            paintOrder: 'stroke fill',
          }}
        >
          {ctaText}
        </div>
        <div
          style={{
            fontFamily: T.font,
            fontWeight: 900,
            fontSize: 46,
            textAlign: 'center',
            color: '#fff',
            background: T.uiRed,
            borderRadius: 24,
            padding: '20px 34px',
            transform: `translateY(${(1 - pv) * 60}px)`,
            opacity: Math.min(1, pv * 1.5),
          }}
        >
          VOTE IN THE POLL + COMMENT A OR B!
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
