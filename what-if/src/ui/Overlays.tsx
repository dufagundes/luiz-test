import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, ease, hit, seg} from '../lib/anim';

export const UI_FONT = '"Baloo 2", "Noto Color Emoji", "Segoe UI Emoji", Arial, sans-serif';

// Safe zone for Shorts / Reels / TikTok: keep text out of the top ~220 px, bottom ~420 px and right ~150 px.
export const SAFE = {top: 230, bottom: 430, side: 90, right: 150};

const stroke = (px: number, color = '#1b1b2f') =>
  `${color} 0 ${px}px 0, ${color} ${px}px 0 0, ${color} 0 -${px}px 0, ${color} -${px}px 0 0, ${color} ${px * 0.7}px ${px * 0.7}px 0, ${color} -${px * 0.7}px ${px * 0.7}px 0, ${color} ${px * 0.7}px -${px * 0.7}px 0, ${color} -${px * 0.7}px -${px * 0.7}px 0, rgba(0,0,0,0.35) 0 ${px * 1.8}px ${px * 1.5}px`;

/** the hook question at the top of the first shot */
export const HookTitle: React.FC<{t: number}> = ({t}) => {
  const a = seg(t, 0.15, 0.55, ease.outBack);
  const out = seg(t, 3.05, 3.35);
  if (a <= 0 || out >= 1) return null;
  const lines = ['WHAT IF A COW', 'WENT GROCERY', 'SHOPPING?'];
  return (
    <AbsoluteFill style={{alignItems: 'center', top: SAFE.top + 20, height: 520, justifyContent: 'flex-start', opacity: 1 - out}}>
      <div style={{transform: `scale(${0.5 + 0.5 * a}) rotate(${-3 + Math.sin(t * 3) * 1.2}deg)`, textAlign: 'center'}}>
        {lines.map((l, i) => {
          const k = seg(t, 0.15 + i * 0.22, 0.5 + i * 0.22, ease.outBack);
          return (
            <div key={l} style={{
              fontFamily: UI_FONT, fontWeight: 800, fontSize: i === 2 ? 132 : 112, lineHeight: 1.0,
              color: i === 2 ? '#ffd21f' : '#ffffff', textShadow: stroke(7), transform: `translateY(${(1 - k) * 60}px)`, opacity: k,
            }}>{l}</div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** a comic sound-word that slams in (SLAM!, MOOOO!, CRASH!) */
export const ComicWord: React.FC<{t: number; t0: number; dur: number; text: string; color: string; top: number; size?: number; rot?: number; left?: number}> = ({t, t0, dur, text, color, top, size = 190, rot = -8, left}) => {
  if (t < t0 || t > t0 + dur) return null;
  const a = seg(t, t0, t0 + 0.22, ease.outBack);
  const out = seg(t, t0 + dur - 0.2, t0 + dur);
  const wob = Math.sin((t - t0) * 30) * 4 * hit(t, t0, 0.3);
  return (
    <div style={{
      position: 'absolute', top, left: left ?? 0, width: left === undefined ? '100%' : undefined, textAlign: 'center',
      fontFamily: UI_FONT, fontWeight: 800, fontSize: size, color, textShadow: stroke(9),
      transform: `scale(${(0.3 + 0.7 * a) * (1 - 0.3 * out)}) rotate(${rot + wob}deg)`, opacity: 1 - out, letterSpacing: 2,
    }}>{text}</div>
  );
};

/** red-tinted dramatic vignette + white impact flashes */
export const Grade: React.FC<{t: number; drama: number; flash: number; dim?: number}> = ({drama, flash, dim = 0}) => (
  <>
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 35%, rgba(40,0,20,${0.55 * drama}) 100%)`}} />
    <AbsoluteFill style={{background: `rgba(255,120,130,${0.08 * drama})`, mixBlendMode: 'multiply'}} />
    {dim > 0 && <AbsoluteFill style={{background: `rgba(15,10,40,${dim})`}} />}
    {flash > 0.01 && <AbsoluteFill style={{background: `rgba(255,255,255,${clamp(flash)})`}} />}
  </>
);

/** comic "speed lines" burst used behind shocked moments */
export const SpeedLines: React.FC<{amount: number; t: number}> = ({amount, t}) => {
  if (amount <= 0.01) return null;
  const lines = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * 360 + Math.sin(i * 12.9) * 4;
    const len = 300 + ((i * 97) % 200) + Math.sin(t * 20 + i) * 40;
    lines.push(
      <div key={i} style={{
        position: 'absolute', left: 540, top: 900, width: len, height: 6 + (i % 3) * 3, background: 'rgba(255,255,255,0.9)',
        transformOrigin: '0 50%', transform: `rotate(${a}deg) translateX(${620 - len * 0.2}px)`, borderRadius: 4,
      }} />,
    );
  }
  return <AbsoluteFill style={{opacity: amount, overflow: 'hidden'}}>{lines}</AbsoluteFill>;
};

/** the end card */
export const EndCard: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  if (t < t0) return null;
  const a = seg(t, t0 + 0.15, t0 + 0.5, ease.outBack);
  const b = seg(t, t0 + 0.9, t0 + 1.25, ease.outBack);
  const pulse = 1 + 0.03 * Math.sin((t - t0) * 5);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 160}}>
      <div style={{
        fontFamily: UI_FONT, fontWeight: 800, fontSize: 210, color: '#ffd21f', textShadow: stroke(10), lineHeight: 1,
        transform: `scale(${a * pulse}) rotate(-4deg)`, opacity: Math.min(1, a * 2),
      }}>WHAT IF...?</div>
      <div style={{
        marginTop: 70, padding: '28px 44px', maxWidth: 1080 - 2 * SAFE.side, background: '#ef476f', borderRadius: 36,
        border: '8px solid #1b1b2f', boxShadow: '0 14px 0 #1b1b2f', textAlign: 'center',
        fontFamily: UI_FONT, fontWeight: 800, fontSize: 70, lineHeight: 1.08, color: '#ffffff',
        transform: `scale(${b}) rotate(2deg)`, opacity: Math.min(1, b * 2),
      }}>FOLLOW FOR MORE<br />RIDICULOUS SCENARIOS 🐄</div>
    </AbsoluteFill>
  );
};
