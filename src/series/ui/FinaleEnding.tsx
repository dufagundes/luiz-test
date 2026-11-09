import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame} from 'remotion';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import {T} from '../theme';
import {clamp} from '../../lib/anim';
import {SeriesLogo} from './SeriesUI';
import {SAFE} from './InteractiveEnding';

/**
 * Series-finale end screen (no poll):
 *   Phase 1: "THE LAST SIGNAL" logo + "THE END."
 *   Phase 2: "WHAT DID YOU THINK OF THE ENDING? 👀" / "DROP YOUR THEORY IN THE COMMENTS 👇" / "FOLLOW FOR A BRAND-NEW STORY 🎬"
 * All text stays inside the mobile safe zone.
 */
export const FinaleEnding: React.FC<{at: number; phase2At: number}> = ({at, phase2At}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const t = frame - at;
  const sp = (from: number, damping = 13, stiffness = 140) => spring({frame: frame - from, fps: 30, config: {damping, stiffness, mass: 0.8}});
  const bg = interpolate(t, [0, 18], [0, 1], clamp);
  const p1 = interpolate(frame, [phase2At - 8, phase2At + 6], [1, 0], clamp);
  const logo = sp(at + 6, 16, 90);
  const end = interpolate(frame, [at + 26, at + 44], [0, 1], clamp);
  const l1 = sp(phase2At + 4);
  const l2 = sp(phase2At + 16, 10, 180);
  const l3 = sp(phase2At + 28, 10, 160);
  const finger = Math.abs(Math.sin(frame * 0.25)) * 12;
  const pulse = 1 + 0.025 * Math.sin(frame * 0.2);

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: `rgba(2,2,6,${0.9 * bg})`}} />
      {/* the signal, finally fading: rings shrink inward and dim */}
      <AbsoluteFill style={{opacity: 0.45 * bg}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          {[0, 1, 2, 3].map((i) => {
            const k = 1 - ((frame * 0.006 + i / 4) % 1);
            return <circle key={i} cx={470} cy={800} r={60 + k * 640} fill="none" stroke={T.uiRed} strokeWidth={3 * k} opacity={0.4 * k * (1 - interpolate(t, [0, 300], [0, 0.7], clamp))} />;
          })}
        </svg>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: SAFE.left, right: SAFE.right, top: SAFE.top, bottom: SAFE.bottom}}>
        {/* phase 1 */}
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 50, opacity: p1}}>
          <div style={{transform: `scale(${0.8 + 0.2 * logo})`, opacity: Math.min(1, logo * 1.4)}}>
            <SeriesLogo size={1.05} />
          </div>
          <div
            style={{
              fontFamily: T.font,
              fontWeight: 900,
              fontSize: 96,
              letterSpacing: 26 - 10 * end,
              color: '#fff',
              opacity: end,
              textShadow: '0 0 40px rgba(255,255,255,0.35)',
            }}
          >
            THE END.
          </div>
        </div>
        {/* phase 2 */}
        {frame >= phase2At - 6 ? (
          <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 44}}>
            <div style={{fontFamily: T.font, fontWeight: 800, fontSize: 28, letterSpacing: 8, color: T.uiRed, opacity: l1}}>THE LAST SIGNAL · SERIES FINALE</div>
            <div
              style={{
                fontFamily: T.font,
                fontWeight: 900,
                fontSize: 58,
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                color: '#fff',
                transform: `translateY(${(1 - l1) * 50}px)`,
                opacity: Math.min(1, l1 * 1.5),
                textShadow: '0 6px 0 rgba(0,0,0,0.6)',
              }}
            >
              WHAT DID YOU THINK
              <br />
              OF THE ENDING? 👀
            </div>
            <div
              style={{
                fontFamily: T.font,
                fontWeight: 900,
                fontSize: 60,
                lineHeight: 1.1,
                color: '#ffd84d',
                WebkitTextStroke: '10px #000',
                paintOrder: 'stroke fill',
                transform: `scale(${(0.6 + 0.4 * l2) * pulse})`,
                transformOrigin: 'left center',
                opacity: Math.min(1, l2 * 1.5),
              }}
            >
              DROP YOUR THEORY
              <br />
              IN THE COMMENTS <span style={{display: 'inline-block', transform: `translateY(${finger}px)`}}>👇</span>
            </div>
            <div
              style={{
                alignSelf: 'flex-start',
                fontFamily: T.font,
                fontWeight: 900,
                fontSize: 50,
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                color: '#fff',
                background: T.uiRed,
                borderRadius: 26,
                padding: '22px 30px',
                boxShadow: `0 0 ${30 + 20 * Math.sin(frame * 0.2)}px rgba(255,46,77,0.6)`,
                transform: `translateX(${(1 - l3) * -400}px)`,
                opacity: Math.min(1, l3 * 1.5),
              }}
            >
              FOLLOW FOR A
              <br />
              BRAND-NEW STORY 🎬
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
