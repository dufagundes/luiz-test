import React from 'react';
import {T} from '../theme';
import {HamRadio} from '../props/HamRadio';

/**
 * NORA'S ATTIC BEDROOM (Vance house, 14 Maple Street). World coordinates 2000 x 1920.
 *   Door:          x 180–480, y 820–1500 (left wall)
 *   Dormer window: x 850–1150, y 450–850 (center; rain outside)
 *   Desk + radio:  desk x 1300–1900 (top y 1180), ham radio at x 1420, y 960
 *   Floor:         y >= 1500
 */
export const ATTIC = {
  door: {x: 180, y: 820, w: 300, h: 680},
  window: {x: 850, y: 450, w: 300, h: 400},
  radio: {x: 1420, y: 960, s: 1},
  floorY: 1500,
};

export type AtticProps = {
  frame: number;
  power?: number; // warm lights (lamp + string lights) 0..1
  radioPower?: number;
  radioDanger?: number;
  radioWave?: number;
  doorOpen?: number; // 0..1
  doorway?: React.ReactNode; // drawn in the open doorway
  outside?: React.ReactNode; // drawn in the window (behind glass, over the rainy sky)
  windowOpen?: number; // 0..1 the casement swings open
  lightning?: number;
};

const Rain: React.FC<{frame: number; x: number; y: number; w: number; h: number; n?: number}> = ({frame, x, y, w, h, n = 40}) => (
  <g>
    {[...Array(n)].map((_, i) => {
      const px = x + ((i * 53.3) % w);
      const py = y + ((i * 97.1 + frame * 38) % (h + 60)) - 60;
      return <line key={i} x1={px} y1={py} x2={px - 6} y2={py + 40} stroke="#9fb6e8" strokeWidth={2.5} opacity={0.45} />;
    })}
  </g>
);

export const Attic: React.FC<AtticProps> = ({
  frame,
  power = 1,
  radioPower = 0,
  radioDanger = 0,
  radioWave = 0,
  doorOpen = 0,
  doorway,
  outside,
  windowOpen = 0,
  lightning = 0,
}) => {
  const W = ATTIC.window;
  const D = ATTIC.door;
  const flicker = power * (0.92 + 0.08 * Math.sin(frame * 0.7) * Math.sin(frame * 0.23));
  return (
    <g>
      <defs>
        <linearGradient id="atticWallG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={T.atticWallDark} />
          <stop offset="1" stopColor={T.atticWall} />
        </linearGradient>
        <linearGradient id="atticSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070a16" />
          <stop offset="1" stopColor="#1d2547" />
        </linearGradient>
        <radialGradient id="lampGlow">
          <stop offset="0" stopColor={T.warm} stopOpacity="0.85" />
          <stop offset="1" stopColor={T.warm} stopOpacity="0" />
        </radialGradient>
        <clipPath id="atticWinClip">
          <rect x={W.x} y={W.y} width={W.w} height={W.h} />
        </clipPath>
        <clipPath id="atticDoorClip">
          <rect x={D.x} y={D.y} width={D.w} height={D.h} />
        </clipPath>
      </defs>
      {/* back wall + sloped ceiling */}
      <rect x={-600} y={-400} width={3200} height={2000} fill="url(#atticWallG)" />
      <path d="M -600 1050 L 640 250 L -600 250 Z" fill="#14152a" />
      <path d="M 2600 1050 L 1360 250 L 2600 250 Z" fill="#14152a" />
      <rect x={-600} y={-400} width={3200} height={650} fill="#101124" />
      <path d="M -600 1050 L 640 250 L 1360 250 L 2600 1050" fill="none" stroke={T.atticBeam} strokeWidth={30} />
      {[-200, 200, 1800, 2200].map((bx) => (
        <line key={bx} x1={bx} y1={bx < 1000 ? 1050 - ((bx + 600) / 1240) * 800 : 250 + ((bx - 1360) / 1240) * 800} x2={bx} y2={1500} stroke="#25263e" strokeWidth={22} />
      ))}
      {/* string lights along the slope */}
      {[...Array(9)].map((_, i) => {
        const x = 700 + i * 70;
        const y = 300 + Math.sin(i * 1.1) * 14 + 20;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={34} fill="url(#lampGlow)" opacity={0.5 * flicker} />
            <circle cx={x} cy={y} r={8} fill={power > 0.1 ? '#ffd79a' : '#3a3242'} />
          </g>
        );
      })}
      <path d={`M 690 316 ${[...Array(9)].map((_, i) => `L ${700 + i * 70} ${300 + Math.sin(i * 1.1) * 14 + 20}`).join(' ')}`} stroke="#0e0e18" strokeWidth={3} fill="none" />

      {/* dormer window */}
      <g clipPath="url(#atticWinClip)">
        <rect x={W.x} y={W.y} width={W.w} height={W.h} fill="url(#atticSky)" />
        {/* far town lights + tower blink */}
        <path d={`M ${W.x} ${W.y + 300} Q ${W.x + 150} ${W.y + 250} ${W.x + 300} ${W.y + 290} L ${W.x + 300} ${W.y + 400} L ${W.x} ${W.y + 400} Z`} fill="#0b0f1e" />
        {/* the relay tower on Cutter's Hill */}
        <path d={`M ${W.x + 204} ${W.y + 285} L ${W.x + 220} ${W.y + 150} L ${W.x + 236} ${W.y + 285}`} stroke="#3a4470" strokeWidth={3.5} fill="none" />
        <path d={`M ${W.x + 207} ${W.y + 255} L ${W.x + 233} ${W.y + 225} M ${W.x + 233} ${W.y + 255} L ${W.x + 207} ${W.y + 225} M ${W.x + 211} ${W.y + 215} L ${W.x + 229} ${W.y + 190} M ${W.x + 229} ${W.y + 215} L ${W.x + 211} ${W.y + 190}`} stroke="#3a4470" strokeWidth={2} />
        <circle cx={W.x + 220} cy={W.y + 148} r={26} fill="url(#gRed)" opacity={(frame % 40) < 20 ? 0.9 : 0.25} />
        <circle cx={W.x + 220} cy={W.y + 148} r={4.5} fill={T.signalRed} opacity={(frame % 40) < 20 ? 1 : 0.3} />
        {outside}
        <Rain frame={frame} x={W.x} y={W.y} w={W.w} h={W.h} n={26} />
        {lightning > 0 ? <rect x={W.x} y={W.y} width={W.w} height={W.h} fill="#e6eeff" opacity={lightning} /> : null}
      </g>
      {/* glass + frame (casement opens inward = squash) */}
      <g transform={`translate(${W.x} ${W.y}) scale(${1 - windowOpen * 0.85} 1)`}>
        <rect x={0} y={0} width={W.w} height={W.h} fill="#9bb7ff" opacity={0.07} />
        <line x1={W.w / 2} y1={0} x2={W.w / 2} y2={W.h} stroke="#2e2b40" strokeWidth={14} />
        <line x1={0} y1={W.h / 2} x2={W.w} y2={W.h / 2} stroke="#2e2b40" strokeWidth={14} />
        {/* raindrops on glass */}
        {[...Array(8)].map((_, i) => (
          <circle key={i} cx={(i * 71) % W.w} cy={(i * 113 + frame * 0.6 * (1 + (i % 3))) % W.h} r={4} fill="#cfe0ff" opacity={0.35} />
        ))}
      </g>
      <rect x={W.x - 20} y={W.y - 20} width={W.w + 40} height={W.h + 40} fill="none" stroke="#3a3350" strokeWidth={24} />
      <rect x={W.x - 40} y={W.y + W.h + 12} width={W.w + 80} height={22} rx={6} fill="#3a3350" />

      {/* poster: the frequency */}
      <g transform="rotate(4 1500 600)">
        <rect x={1400} y={500} width={180} height={240} fill="#2e2440" />
        <path d="M 1490 700 L 1490 560 M 1455 700 L 1490 560 L 1525 700" stroke="#8b6ab8" strokeWidth={6} fill="none" />
        <text x={1490} y={540} fill="#c9a8ff" fontFamily={T.mono} fontSize={22} fontWeight={700} textAnchor="middle">
          114.7
        </text>
      </g>
      {/* photo of Dad (Elias) pinned to wall */}
      <g transform="rotate(-6 1700 640)">
        <rect x={1640} y={580} width={110} height={130} fill="#e9e1cf" />
        <rect x={1650} y={590} width={90} height={90} fill="#3e4f6b" />
        <circle cx={1695} cy={628} r={22} fill="#ecc19c" />
        <path d="M 1672 618 C 1672 596 1718 596 1718 618 Z" fill="#8a3e26" />
        <circle cx={1694} cy={580} r={6} fill={T.signalRed} />
      </g>

      {/* door + doorway */}
      <g clipPath="url(#atticDoorClip)">
        <rect x={D.x} y={D.y} width={D.w} height={D.h} fill="#0a0a12" />
        {doorway}
      </g>
      <rect x={D.x - 20} y={D.y - 20} width={D.w + 40} height={D.h + 20} fill="none" stroke="#3a3350" strokeWidth={20} />
      <g transform={`translate(${D.x} ${D.y}) scale(${Math.cos(doorOpen * 1.35)} 1)`}>
        <rect x={0} y={0} width={D.w} height={D.h} fill="#3d3150" />
        <rect x={34} y={40} width={D.w - 68} height={260} rx={8} fill="none" stroke="#2e2540" strokeWidth={12} />
        <rect x={34} y={360} width={D.w - 68} height={280} rx={8} fill="none" stroke="#2e2540" strokeWidth={12} />
        <circle cx={D.w - 40} cy={360} r={14} fill="#a39a7e" />
      </g>

      {/* floor + rug */}
      <rect x={-600} y={ATTIC.floorY} width={3200} height={700} fill={T.floor} />
      {[...Array(12)].map((_, i) => (
        <line key={i} x1={-600 + i * 300} y1={ATTIC.floorY} x2={-1000 + i * 380} y2={2200} stroke="#2e252b" strokeWidth={4} />
      ))}
      <ellipse cx={900} cy={1700} rx={460} ry={90} fill="#3b2c48" />
      <ellipse cx={900} cy={1700} rx={380} ry={66} fill="none" stroke="#5a4470" strokeWidth={8} />

      {/* desk */}
      <rect x={1300} y={1180} width={600} height={26} rx={6} fill={T.woodLight} />
      <rect x={1320} y={1206} width={30} height={294} fill={T.wood} />
      <rect x={1850} y={1206} width={30} height={294} fill={T.wood} />
      <rect x={1640} y={1206} width={210} height={150} fill={T.wood} />
      {/* lamp */}
      <path d="M 1360 1180 L 1360 1040 L 1420 980" stroke="#4b4060" strokeWidth={10} fill="none" />
      <path d="M 1400 960 L 1460 1000 L 1430 1040 L 1370 1000 Z" fill="#5b4a70" />
      <circle cx={1420} cy={1060} r={260} fill="url(#lampGlow)" opacity={0.55 * flicker} style={{mixBlendMode: 'screen'}} />
      {/* papers + mug */}
      <rect x={1780} y={1160} width={90} height={20} fill="#d9d3c4" transform="rotate(-5 1820 1170)" />
      <rect x={1330} y={1130} width={40} height={50} rx={6} fill="#a8472a" />
      {/* the radio */}
      <g transform={`translate(${ATTIC.radio.x} ${ATTIC.radio.y})`}>
        <HamRadio frame={frame} power={radioPower} danger={radioDanger} wave={radioWave} />
      </g>
      {/* global dimming when the power is out */}
      <rect x={-600} y={-400} width={3200} height={2600} fill="#020208" opacity={(1 - power) * 0.45} />
    </g>
  );
};
