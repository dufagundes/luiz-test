import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../components/Camera';
import {Defs} from '../components/Room';
import {BigPhone} from '../components/Phone';
import {Vignette, Wash} from '../components/Effects';
import {COLORS} from '../lib/constants';
import {easeIn, easeInOut, easeOut, tween, wobble} from '../lib/anim';
import {Dust, Light} from './common';

/** SCENE 1 (0–3.5s) — HOOK: a phone lights up in the dark at 3:17 with a warning from "Me (2034)". */
export const S1Hook: React.FC = () => {
  const f = useCurrentFrame();

  // phone vibrating on the nightstand
  const buzzing = f < 16 ? Math.sin(f * 3.1) * 9 : 0;
  const push = tween(f, [0, 80], [1, 1.16], easeInOut);
  // Maya's hand reaches in and picks the phone up
  const reach = tween(f, [52, 82], [0, 1], easeOut);
  const lift = tween(f, [82, 105], [0, 1], easeIn);
  const phoneScale = 0.92 + lift * 0.5;
  const phoneRot = -6 + lift * 6;
  const phoneY = 930 - lift * 120;
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.35);

  return (
    <AbsoluteFill>
      <Stage bg="#04050a">
        <Defs />
        <g transform={`translate(540 960) scale(${push}) translate(-540 -960)`}>
          {/* dark wall with blurred red clock bokeh */}
          <rect x={-200} y={-200} width={1500} height={1400} fill="#0a0e1c" />
          <circle cx={880} cy={380} r={160} fill="url(#redGlow)" opacity={0.4 + 0.1 * wobble(f, 2)} />
          <circle cx={170} cy={260} r={220} fill="url(#moonGlow)" opacity={0.25} />
          {/* nightstand top in perspective */}
          <path d="M -200 1120 L 1280 1120 L 1500 2200 L -420 2200 Z" fill={COLORS.woodLight} />
          <path d="M -200 1120 L 1280 1120 L 1290 1150 L -210 1150 Z" fill="#4a3f5c" />
          {/* wood grain */}
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M ${-300 + i * 60} ${1300 + i * 170} Q 540 ${1270 + i * 170} ${1380 - i * 30} ${1310 + i * 170}`} stroke="#2e2640" strokeWidth={5} fill="none" opacity={0.6} />
          ))}
          {/* phone light pool on the wood */}
          <ellipse cx={540} cy={1500} rx={640} ry={260} fill="url(#phoneGlow)" opacity={0.6} style={{mixBlendMode: 'screen'}} />
          <Dust frame={f} x={0} y={200} w={1080} h={900} n={18} />
        </g>

        {/* Maya's hand coming in from the bottom right */}
        <g transform={`translate(${1180 - reach * 380} ${2050 - reach * 650 - lift * 110}) rotate(${-38 + reach * 10})`}>
          <rect x={-70} y={0} width={140} height={700} rx={60} fill={COLORS.hoodie} />
          <rect x={-74} y={-10} width={148} height={60} rx={24} fill={COLORS.hoodieShade} />
          <ellipse cx={0} cy={-40} rx={70} ry={80} fill={COLORS.skin} />
          <ellipse cx={-55} cy={-90} rx={22} ry={46} fill={COLORS.skin} transform="rotate(-20 -55 -90)" />
          <ellipse cx={0} cy={-40} rx={70} ry={80} fill={COLORS.phone} opacity={0.25} />
        </g>

        <BigPhone
          frame={f}
          x={540 + buzzing}
          y={phoneY}
          scale={phoneScale}
          rotate={phoneRot + buzzing * 0.2}
          mode="lock"
          notifAt={4}
          notifText={"DON'T OPEN\nTHE DOOR."}
          screenOn={tween(f, [0, 3], [0, 1])}
        />
        <Light x={540} y={phoneY - 100} r={700} color="red" opacity={0.18 * pulse} />
      </Stage>
      <Wash opacity={0.12 * pulse} color={COLORS.danger} blend="overlay" />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};
