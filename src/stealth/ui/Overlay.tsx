import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import {C, clamp, FONT, FPS, lerp, pop, ramp, sceneStartFrame, SCENES, smooth, TL, W, H} from '../lib';

export const FEATURES = ['Flying-wing shape', 'Radar-reflecting geometry', 'Radar-absorbent materials', 'Reduced heat signature', 'Internal payload storage'];

const sceneIndexAt = (frame: number) => {
  let i = 0;
  for (let k = 0; k < SCENES.length; k++) if (frame >= sceneStartFrame(k)) i = k;
  return i;
};
/** How many features have been ticked at time t (seconds), fractional during the tick animation. */
const ticked = (t: number) => TL.ticks.reduce((n, tk) => n + clamp((t - tk) / 0.35), 0);

// ------------------------------------------------------------------ checklist (top-left)
const Check: React.FC<{p: number}> = ({p}) => (
  <svg width={40} height={40} viewBox="0 0 40 40">
    <circle cx={20} cy={20} r={17} fill={p > 0 ? C.green : 'none'} opacity={p > 0 ? 0.18 + 0.82 * p : 1} stroke={p > 0 ? C.green : 'rgba(255,255,255,0.45)'} strokeWidth={3} />
    <path d="M11 20.5 L17.5 27 L29.5 13.5" fill="none" stroke="#06210f" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - p)} />
  </svg>
);

export const Checklist: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const si = sceneIndexAt(frame);
  const scene = SCENES[si];
  const appear = ramp(t, TL.cuts[1] - 0.1, TL.cuts[1] + 0.5);
  if (appear <= 0) return null;
  const active = scene.startsWith('f') ? Number(scene.slice(1)) - 1 : -1;
  const allDone = scene === 'together' || scene === 'outro';
  const togetherT = t - TL.cuts[SCENES.indexOf('together')];
  return (
    <div
      style={{
        position: 'absolute',
        left: 34,
        top: 118,
        width: 570,
        padding: '20px 20px 14px',
        borderRadius: 22,
        background: C.panel,
        border: '2px solid rgba(56,225,255,0.35)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
        fontFamily: FONT,
        transform: `translateX(${(1 - appear) * -640}px)`,
        opacity: appear,
      }}
    >
      <div style={{color: C.cyan, fontWeight: 800, fontSize: 22, letterSpacing: 4, marginBottom: 10, display: 'flex', justifyContent: 'space-between'}}>
        <span>STEALTH FEATURES</span>
        <span style={{color: 'rgba(255,255,255,0.65)'}}>{Math.min(5, Math.floor(ticked(t) + 0.001))}/5</span>
      </div>
      {FEATURES.map((name, i) => {
        const p = clamp(ticked(t) - i);
        const isActive = i === active;
        const wave = allDone ? pop(togetherT, 0.15 + i * 0.12, 0.4) : 0;
        const glow = isActive ? 1 : allDone ? clamp(wave) * (1 - ramp(togetherT, 1.5, 2.5)) : 0;
        return (
          <div
            key={name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              height: 54,
              padding: '0 12px',
              margin: '3px 0',
              borderRadius: 12,
              background: isActive ? 'rgba(255,212,0,0.16)' : glow > 0 ? `rgba(61,255,139,${0.16 * glow})` : 'transparent',
              border: isActive ? `2px solid ${C.accent}` : '2px solid transparent',
              transform: `scale(${isActive ? 1.03 : 1 + 0.04 * clamp(wave) * (1 - ramp(togetherT, 1.5, 2.5))})`,
              transformOrigin: 'left center',
            }}
          >
            <Check p={p} />
            <span
              style={{
                fontSize: 27,
                fontWeight: isActive ? 900 : 700,
                color: p >= 1 ? '#c8ffdc' : isActive ? '#ffffff' : 'rgba(255,255,255,0.72)',
                whiteSpace: 'nowrap',
              }}
            >
              {i + 1}. {name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------ radar HUD (top-right)
const ECHO_LEVELS = [1, 0.62, 0.38, 0.22, 0.12, 0.06];
export const echoLevel = (t: number) => {
  const n = ticked(t);
  const i = Math.floor(n);
  return lerp(ECHO_LEVELS[Math.min(5, i)], ECHO_LEVELS[Math.min(5, i + 1)], n - i);
};

export const RadarHUD: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const size = 270;
  const sweep = ((t * 180) % 360) - 90; // one revolution every 2 s
  const hookEnd = TL.cuts[1];
  const hookLine = TL.lines[0];
  // in the hook the radar takes centre stage to show the "bird-sized" echo
  const big = ramp(t, hookLine.chunks[2].start - 0.15, hookLine.chunks[2].start + 0.35) * (1 - ramp(t, hookEnd - 0.45, hookEnd - 0.05));
  const inHook = t < hookEnd;
  const level = inHook ? 0.05 : echoLevel(t);
  const blipAng = -38; // degrees, screen angle of the target
  const blipR = 0.56;
  const since = (((sweep - blipAng) % 360) + 360) % 360; // degrees since the sweep passed the blip
  const blipA = Math.exp(-since / 140);
  const bx = 135 + Math.cos((blipAng * Math.PI) / 180) * blipR * 120;
  const by = 135 + Math.sin((blipAng * Math.PI) / 180) * blipR * 120;
  const appear = ramp(t, 0.15, 0.6);
  const cx = lerp(W - 34 - size / 2, W / 2, big);
  const cy = lerp(118 + size / 2, 900, big);
  const sc = lerp(1, 2.7, big);
  const meterW = 270;
  return (
    <>
      {big > 0 && <AbsoluteFill style={{background: `rgba(2,8,14,${0.55 * big})`}} />}
      <div
        style={{
          position: 'absolute',
          left: cx - size / 2,
          top: cy - size / 2,
          width: size,
          height: size,
          transform: `scale(${sc * appear})`,
          fontFamily: FONT,
        }}
      >
        <svg width={size} height={size} viewBox="0 0 270 270" style={{overflow: 'visible'}}>
          <defs>
            <radialGradient id="rbg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06311f" />
              <stop offset="100%" stopColor="#020d08" />
            </radialGradient>
            <linearGradient id="sw" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3dff8b" stopOpacity={0} />
              <stop offset="100%" stopColor="#3dff8b" stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <circle cx={135} cy={135} r={128} fill="url(#rbg)" stroke="#3dff8b" strokeOpacity={0.8} strokeWidth={3} />
          {[40, 80, 120].map((r) => (
            <circle key={r} cx={135} cy={135} r={r} fill="none" stroke="#3dff8b" strokeOpacity={0.25} strokeWidth={1.5} />
          ))}
          <line x1={15} y1={135} x2={255} y2={135} stroke="#3dff8b" strokeOpacity={0.2} />
          <line x1={135} y1={15} x2={135} y2={255} stroke="#3dff8b" strokeOpacity={0.2} />
          {Array.from({length: 36}).map((_, i) => {
            const a = (i * 10 * Math.PI) / 180;
            const r1 = i % 3 === 0 ? 116 : 121;
            return <line key={i} x1={135 + Math.cos(a) * r1} y1={135 + Math.sin(a) * r1} x2={135 + Math.cos(a) * 127} y2={135 + Math.sin(a) * 127} stroke="#3dff8b" strokeOpacity={0.5} strokeWidth={1.5} />;
          })}
          {/* sweep wedge with trailing afterglow */}
          <g transform={`rotate(${sweep} 135 135)`}>
            <path d="M135 135 L255 135 A120 120 0 0 0 238.9 75 Z" fill="url(#sw)" transform="rotate(0 135 135)" />
            <line x1={135} y1={135} x2={255} y2={135} stroke="#b8ffd6" strokeWidth={3} />
          </g>
          {/* target echo */}
          <circle cx={bx} cy={by} r={4 + 16 * level} fill={inHook ? '#ffffff' : level > 0.3 ? C.red : C.accent} opacity={0.25 + 0.75 * blipA} />
          <circle cx={bx} cy={by} r={(4 + 16 * level) * (1 + since / 90)} fill="none" stroke={inHook ? '#ffffff' : level > 0.3 ? C.red : C.accent} strokeWidth={2} opacity={blipA * 0.6} />
          <circle cx={135} cy={135} r={4} fill="#b8ffd6" />
          {big > 0.05 && (
            <g opacity={big}>
              <line x1={bx - 4} y1={by + 6} x2={135} y2={196} stroke="#fff" strokeWidth={1.2} />
              <text x={135} y={212} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={900} letterSpacing={1} stroke="#020d08" strokeWidth={3} paintOrder="stroke">
                BIRD-SIZED ECHO?*
              </text>
            </g>
          )}
        </svg>
        {big > 0.05 && (
          <div style={{position: 'absolute', top: size + 8, width: size, textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 8.5, fontWeight: 600, opacity: big}}>
            *commonly reported comparison, not an official figure
          </div>
        )}
      </div>
      {/* echo-strength meter under the HUD */}
      {!inHook && (
        <div
          style={{
            position: 'absolute',
            right: 34,
            top: 118 + size + 14,
            width: meterW,
            fontFamily: FONT,
            opacity: ramp(t, hookEnd, hookEnd + 0.5),
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', color: '#d8ffe8', fontSize: 19, fontWeight: 800, letterSpacing: 2}}>
            <span>RADAR ECHO</span>
            <span style={{color: level > 0.3 ? C.red : C.green}}>{level > 0.5 ? 'HIGH' : level > 0.15 ? 'MED' : 'LOW'}</span>
          </div>
          <div style={{marginTop: 6, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.25)'}}>
            <div
              style={{
                width: `${level * 100}%`,
                height: '100%',
                borderRadius: 8,
                background: `linear-gradient(90deg, ${C.green}, ${level > 0.3 ? C.red : C.accent})`,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ subtitles
type Chunk = {text: string; start: number; end: number; words: {w: string; start: number; end: number}[]};
const CHUNKS: Chunk[] = TL.lines.flatMap((l) => l.chunks);

export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let idx = -1;
  for (let i = 0; i < CHUNKS.length; i++) {
    const next = CHUNKS[i + 1];
    const until = next ? Math.min(next.start, CHUNKS[i].end + 0.5) : CHUNKS[i].end + 0.6;
    if (t >= CHUNKS[i].start - 0.04 && t < until) idx = i;
  }
  if (idx < 0) return null;
  const ch = CHUNKS[idx];
  const inP = pop(t, ch.start - 0.04, 0.22);
  const big = ch.text.length < 18;
  return (
    <div
      style={{
        position: 'absolute',
        left: 50,
        right: 50,
        top: 1330,
        height: 260,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${0.85 + 0.15 * inP})`,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: big ? 84 : 72,
          lineHeight: 1.12,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {ch.words.map((w, i) => {
          const shown = t >= w.start - 0.05;
          const cur = t >= w.start - 0.05 && t < w.end + 0.02;
          const p = pop(t, w.start - 0.05, 0.18);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                margin: '0 0.14em',
                color: cur ? C.accent : '#ffffff',
                opacity: shown ? 1 : 0,
                transform: `translateY(${(1 - p) * 18}px) scale(${shown ? 0.9 + 0.1 * p + (cur ? 0.06 : 0) : 0.8})`,
                WebkitTextStroke: '12px #05080d',
                paintOrder: 'stroke fill',
                textShadow: '0 6px 18px rgba(0,0,0,0.65)',
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ feature title card
export const FeatureTitle: React.FC<{n: number; t: number; dur: number}> = ({n, t, dur}) => {
  const a = pop(t, 0.05, 0.45);
  const out = ramp(t, dur - 0.35, dur);
  return (
    <div
      style={{
        position: 'absolute',
        top: 500,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        fontFamily: FONT,
        opacity: clamp(a) * (1 - out),
        transform: `translateY(${(1 - a) * -30}px)`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '12px 30px 12px 14px', borderRadius: 999, background: 'rgba(8,14,24,0.78)', border: `2px solid ${C.accent}`}}>
        <div style={{width: 58, height: 58, borderRadius: 999, background: C.accent, color: C.ink, fontWeight: 900, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{n}</div>
        <div style={{color: '#fff', fontWeight: 900, fontSize: 38, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{FEATURES[n - 1]}</div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ label pinned to a 3D point
export const Tag: React.FC<{
  at: {x: number; y: number; visible?: boolean};
  dx?: number;
  dy?: number;
  text: string;
  sub?: string;
  color?: string;
  p: number; // 0..1 appear
  align?: 'left' | 'right' | 'center';
}> = ({at, dx = 120, dy = -90, text, sub, color = C.cyan, p, align}) => {
  if (p <= 0.001 || at.visible === false) return null;
  const lx = at.x + dx;
  const ly = at.y + dy;
  const al = align ?? (dx >= 0 ? 'left' : 'right');
  const q = clamp(p);
  // keep labels inside the safe frame
  const boxW = 420;
  const left = al === 'left' ? lx : al === 'right' ? lx - boxW : lx - boxW / 2;
  const clampedLeft = Math.max(30, Math.min(W - 30 - boxW, left));
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <circle cx={at.x} cy={at.y} r={9 * q} fill={color} />
        <circle cx={at.x} cy={at.y} r={18 * q} fill="none" stroke={color} strokeWidth={2.5} opacity={0.6} />
        <polyline
          points={`${at.x},${at.y} ${lx},${ly}`}
          fill="none"
          stroke={color}
          strokeWidth={3.5}
          strokeDasharray={600}
          strokeDashoffset={600 * (1 - q)}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: clampedLeft,
          top: ly - 34,
          width: boxW,
          display: 'flex',
          justifyContent: al === 'left' ? 'flex-start' : al === 'right' ? 'flex-end' : 'center',
          fontFamily: FONT,
          opacity: q,
          transform: `scale(${0.8 + 0.2 * p})`,
          transformOrigin: al === 'left' ? 'left center' : al === 'right' ? 'right center' : 'center',
        }}
      >
        <div style={{padding: '8px 18px', borderRadius: 12, background: 'rgba(6,10,18,0.82)', border: `2.5px solid ${color}`, textAlign: al === 'center' ? 'center' : al}}>
          <div style={{color: '#fff', fontWeight: 900, fontSize: 32, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{text}</div>
          {sub && <div style={{color, fontWeight: 700, fontSize: 22, marginTop: 2, whiteSpace: 'nowrap'}}>{sub}</div>}
        </div>
      </div>
    </>
  );
};

// ------------------------------------------------------------------ transitions + finishing
export const CutFlash: React.FC = () => {
  const frame = useCurrentFrame();
  let a = 0;
  let k = 0;
  for (let i = 1; i < TL.cuts.length; i++) {
    const d = frame - Math.round(TL.cuts[i] * FPS);
    if (d > -5 && d < 9) {
      a = Math.max(a, d < 0 ? (d + 5) / 5 : 1 - d / 9);
      k = i;
    }
  }
  if (a <= 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, rgba(220,245,255,0.95), rgba(56,225,255,0.35) 45%, rgba(0,0,0,0) 75%)', opacity: a * 0.75}} />
      <svg width={W} height={H} style={{position: 'absolute', opacity: a}}>
        {Array.from({length: 14}).map((_, i) => {
          const y = ((i * 137 + k * 311) % 1900) + 10;
          const len = 300 + ((i * 97) % 500);
          const x = ((i * 211 + k * 53) % 1080) - len / 2;
          return <rect key={i} x={x} y={y} width={len} height={3 + (i % 3) * 2} fill="#e8fbff" opacity={0.55} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
      <svg width={W} height={H} style={{position: 'absolute', opacity: 0.06, mixBlendMode: 'overlay'}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 12} />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const p = frame / Math.max(1, TL.durationInFrames - 1);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, height: 8, width: `${smooth(1) * p * 100}%`, background: `linear-gradient(90deg, ${C.cyan}, ${C.accent})`}} />
  );
};
