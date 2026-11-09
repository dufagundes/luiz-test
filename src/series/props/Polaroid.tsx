import React from 'react';
import {Character} from '../rig/Character';
import {ELIAS, NORA, THEO} from '../cast';
import {T} from '../theme';

/**
 * Ch.3 clue: an instant photo taken at the Meridian tower THREE YEARS AGO, the night Elias vanished.
 * Shows (left→right): Elias facing the white light, 14-year-old Theo, and a 13-year-old girl in a yellow
 * raincoat with an auburn ponytail: Nora. Nora has no memory of being there.
 * Local size 520 x 620, origin top-left. Photo area 40,40 → 480,480.
 */
export const Polaroid: React.FC<{frame: number; glow?: number; hideNora?: boolean}> = ({frame, glow = 0, hideNora = false}) => (
  <g>
    <defs>
      <clipPath id="polaroidClip">
        <rect x={40} y={40} width={440} height={440} />
      </clipPath>
      <linearGradient id="polaroidSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0d1428" />
        <stop offset="1" stopColor="#2a2f4a" />
      </linearGradient>
      <radialGradient id="foldLight">
        <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="0.35" stopColor="#e9f4ff" stopOpacity="0.8" />
        <stop offset="1" stopColor="#e9f4ff" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={520} height={620} rx={8} fill="#efeadf" />
    <rect x={0} y={0} width={520} height={620} rx={8} fill="none" stroke="#d6cfbf" strokeWidth={4} />
    <g clipPath="url(#polaroidClip)">
      <rect x={40} y={40} width={440} height={440} fill="url(#polaroidSky)" />
      {/* the tower and the light (the Fold) */}
      <path d="M 300 330 L 340 70 L 380 330" stroke="#3a4470" strokeWidth={6} fill="none" />
      <path d="M 308 290 L 372 250 M 372 290 L 308 250 M 318 210 L 362 180 M 362 210 L 318 180" stroke="#3a4470" strokeWidth={4} />
      <circle cx={340} cy={320} r={170 + 10 * Math.sin(frame * 0.2) * glow} fill="url(#foldLight)" opacity={0.95} />
      <path d="M 40 400 Q 260 330 480 390 L 480 480 L 40 480 Z" fill="#0b0f1e" />
      {/* Elias, walking into the light (back toward camera: small, bright rim) */}
      <Character who={ELIAS} x={330} y={395} scale={0.2} frame={0} headTurn={0.9} lookX={1} dark={0.55} />
      {/* young Theo, 14 */}
      <Character who={THEO} x={190} y={430} scale={0.24} frame={0} headTurn={0.5} lookX={1} eyeOpen={1.3} brow={1} mouth="o" dark={0.3} />
      {/* young Nora, 13: yellow raincoat, auburn ponytail */}
      {hideNora ? null : <Character who={NORA} x={105} y={440} scale={0.22} frame={0} headTurn={0.6} lookX={1} eyeOpen={1.2} mouth="closed" dark={0.2} />}
      {/* overexposure / flash bloom + film grain */}
      <rect x={40} y={40} width={440} height={440} fill="#fff4dc" opacity={0.08} />
      {[...Array(30)].map((_, i) => (
        <circle key={i} cx={50 + ((i * 131) % 420)} cy={50 + ((i * 89) % 420)} r={1.4} fill="#fff" opacity={0.25} />
      ))}
    </g>
    {/* handwriting */}
    <text x={60} y={555} fill="#2a2a44" fontFamily="'Segoe Print', 'Comic Sans MS', cursive" fontSize={38} transform="rotate(-2 60 555)">
      Nov 13 · 11:47
    </text>
    <text x={350} y={585} fill={T.signalRed} fontFamily="'Segoe Print', 'Comic Sans MS', cursive" fontSize={26} transform="rotate(-4 350 585)">
      3 yrs ago
    </text>
  </g>
);
