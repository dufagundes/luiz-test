import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame} from 'remotion';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import {T} from '../theme';
import {clamp} from '../../lib/anim';

/**
 * THE LAST SIGNAL: standard interactive ending (Chapter 2 onward).
 *
 *  Phase 1 (at → cardAt): dramatic question + two numbered choices (1 / 2) with short descriptions.
 *                         Voiceover: "What should we do next? Comment 1 or 2 below and tell me why!"
 *  Phase 2 (cardAt → end): "YOUR CHOICE CHANGES THE STORY." / "COMMENT 1 OR 2 👇" / "FOLLOW FOR CHAPTER N 🔥"
 *                         Voiceover: "Follow so you don't miss what happens next!"
 *
 * Mobile safe zone: everything stays inside x 60–880 and y 170–1430, clear of the right-side
 * like/comment/share buttons and the bottom caption area of TikTok / Reels / Shorts.
 */
export type EndingChoice = {title: string; desc: string; icon?: React.ReactNode};

export const SAFE = {left: 60, right: 200, top: 170, bottom: 490}; // px margins in a 1080x1920 frame

const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);

export const InteractiveEnding: React.FC<{
  chapter: number;
  nextChapter: number;
  question: string;
  options: [EndingChoice, EndingChoice];
  at: number; // ending starts (right after the cliffhanger)
  opt1At: number;
  opt2At: number;
  commentAt: number; // "Comment 1 or 2…" line appears (synced to the voiceover)
  cardAt: number; // phase 2 starts
  /** 'v2' (Ch.3+): emoji first, no period: "YOUR CHOICE CHANGES THE STORY" / "👇 COMMENT 1 OR 2" / "🔥 FOLLOW FOR CHAPTER N" */
  wording?: 'v1' | 'v2';
}> = ({chapter, nextChapter, question, options, at, opt1At, opt2At, commentAt, cardAt, wording = 'v1'}) => {
  const v2 = wording === 'v2';
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const t = frame - at;
  const sp = (from: number, damping = 12, stiffness = 160) => spring({frame: frame - from, fps: 30, config: {damping, stiffness, mass: 0.7}});
  const bg = ease(t, 0, 12);
  const phase2 = ease(frame, cardAt, cardAt + 10);
  const pulse = 1 + 0.03 * Math.sin(frame * 0.22);

  // ---------- phase 1 pieces ----------
  const q = sp(at + 2);
  const o1 = sp(opt1At, 11);
  const o2 = sp(opt2At, 11);
  const cm = sp(commentAt, 10, 200);

  const optionCard = (n: 1 | 2, c: EndingChoice, p: number, color: string) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        width: '100%',
        padding: '22px 26px',
        borderRadius: 30,
        background: 'rgba(12,14,26,0.9)',
        border: `5px solid ${color}`,
        boxShadow: `0 0 36px ${color}55`,
        transform: `translateX(${(1 - p) * -500}px) scale(${0.9 + 0.1 * p})`,
        opacity: Math.min(1, p * 1.6),
      }}
    >
      <div
        style={{
          width: 116,
          height: 116,
          borderRadius: 58,
          background: color,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: T.font,
          fontWeight: 900,
          fontSize: 80,
          color: '#fff',
          boxShadow: `0 0 0 8px ${color}33`,
        }}
      >
        {n}
      </div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 6}}>
        <div style={{fontFamily: T.font, fontWeight: 900, fontSize: 58, lineHeight: 1.02, color: '#fff', textTransform: 'uppercase'}}>{c.title}</div>
        <div style={{fontFamily: T.font, fontWeight: 800, fontSize: 32, lineHeight: 1.15, color: '#c9cfe6'}}>{c.desc}</div>
      </div>
      {c.icon ? <div style={{width: 120, height: 120, flexShrink: 0}}>{c.icon}</div> : null}
    </div>
  );

  // ---------- phase 2 pieces ----------
  const l1 = sp(cardAt + 2, 13);
  const l2 = sp(cardAt + 11, 9, 200);
  const l3 = sp(cardAt + 20, 10, 180);
  const finger = Math.abs(Math.sin(frame * 0.25)) * 14;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* the story keeps playing underneath, dimmed */}
      <AbsoluteFill style={{background: `rgba(3,4,10,${0.72 * bg + 0.15 * phase2})`}} />
      {/* signal rings: series motif, subtle motion */}
      <AbsoluteFill style={{opacity: 0.5 * bg}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          {[0, 1, 2, 3].map((i) => {
            const k = ((frame * 0.008 + i / 4) % 1);
            return <circle key={i} cx={470} cy={760} r={120 + k * 700} fill="none" stroke={T.uiRed} strokeWidth={3 * (1 - k)} opacity={0.5 * (1 - k)} />;
          })}
        </svg>
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: SAFE.left,
          right: SAFE.right,
          top: SAFE.top,
          bottom: SAFE.bottom,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        {/* ===== phase 1: question + choices ===== */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 30,
            opacity: 1 - phase2,
            transform: `translateY(${-phase2 * 80}px) scale(${1 - phase2 * 0.06})`,
            position: 'absolute',
            inset: 0,
          }}
        >
          <div style={{fontFamily: T.font, fontWeight: 800, fontSize: 28, letterSpacing: 7, color: T.uiRed, opacity: bg, marginTop: 30}}>THE LAST SIGNAL · CHAPTER {chapter}</div>
          <div
            style={{
              fontFamily: T.font,
              fontWeight: 900,
              fontSize: 74,
              lineHeight: 1.06,
              color: '#fff',
              textTransform: 'uppercase',
              transform: `scale(${0.8 + 0.2 * q})`,
              transformOrigin: 'left center',
              opacity: Math.min(1, q * 1.5),
              textShadow: '0 6px 0 rgba(0,0,0,0.6)',
            }}
          >
            {question}
          </div>
          <div style={{height: 4}} />
          {optionCard(1, options[0], o1, T.uiBlue)}
          {optionCard(2, options[1], o2, T.uiRed)}
          <div
            style={{
              marginTop: 18,
              fontFamily: T.font,
              fontWeight: 900,
              fontSize: 50,
              lineHeight: 1.15,
              color: '#ffd84d',
              WebkitTextStroke: '9px #000',
              paintOrder: 'stroke fill',
              transform: `translateY(${(1 - cm) * 40}px) scale(${frame > commentAt + 15 ? pulse : 1})`,
              transformOrigin: 'left center',
              opacity: Math.min(1, cm * 1.5),
            }}
          >
            {v2 ? (
              <>
                <span style={{display: 'inline-block', transform: `translateY(${finger * 0.6}px)`}}>👇</span> COMMENT 1 OR 2
              </>
            ) : (
              <>
                COMMENT 1 OR 2 BELOW <span style={{display: 'inline-block', transform: `translateY(${finger * 0.6}px)`}}>👇</span>
              </>
            )}
            <br />
            <span style={{color: '#fff', fontSize: 40}}>…and tell me why!</span>
          </div>
        </div>

        {/* ===== phase 2: comment / follow card ===== */}
        {frame >= cardAt ? (
          <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 46}}>
            <div
              style={{
                fontFamily: T.font,
                fontWeight: 900,
                fontSize: 64,
                lineHeight: 1.08,
                whiteSpace: 'nowrap',
                color: '#fff',
                textShadow: `0 0 40px rgba(255,46,77,0.45), 0 6px 0 rgba(0,0,0,0.6)`,
                transform: `translateY(${(1 - l1) * 60}px)`,
                opacity: Math.min(1, l1 * 1.5),
                letterSpacing: 1,
              }}
            >
              YOUR CHOICE
              <br />
              <span style={{color: T.uiRed}}>{v2 ? 'CHANGES THE STORY' : 'CHANGES THE STORY.'}</span>
            </div>
            <div
              style={{
                fontFamily: T.font,
                fontWeight: 900,
                fontSize: 80,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                color: '#ffd84d',
                WebkitTextStroke: '12px #000',
                paintOrder: 'stroke fill',
                transform: `scale(${(0.5 + 0.5 * l2) * pulse})`,
                transformOrigin: 'left center',
                opacity: Math.min(1, l2 * 1.5),
              }}
            >
              {v2 ? (
                <>
                  <span style={{display: 'inline-block', transform: `translateY(${finger}px)`}}>👇</span> COMMENT 1 OR 2
                </>
              ) : (
                <>
                  COMMENT 1 OR 2 <span style={{display: 'inline-block', transform: `translateY(${finger}px)`}}>👇</span>
                </>
              )}
            </div>
            <div
              style={{
                alignSelf: 'flex-start',
                fontFamily: T.font,
                fontWeight: 900,
                fontSize: 50,
                whiteSpace: 'nowrap',
                color: '#fff',
                background: T.uiRed,
                borderRadius: 26,
                padding: '22px 32px',
                boxShadow: `0 0 ${30 + 20 * Math.sin(frame * 0.2)}px rgba(255,46,77,0.6)`,
                transform: `translateX(${(1 - l3) * -400}px)`,
                opacity: Math.min(1, l3 * 1.5),
              }}
            >
              {v2 ? `🔥 FOLLOW FOR CHAPTER ${nextChapter}` : `FOLLOW FOR CHAPTER ${nextChapter} 🔥`}
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
