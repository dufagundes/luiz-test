import React from 'react';
import {T} from '../theme';

/**
 * Elias Vance's old ham radio (the "signal" object of the series).
 * Local size 360 x 220, origin at top-left. Dial reads 114.7 (= 11:47).
 */
export const HamRadio: React.FC<{
  frame: number;
  power?: number; // 0 off .. 1 on
  danger?: number; // 0 amber .. 1 red
  wave?: number; // waveform amplitude 0..1 (voice)
}> = ({frame, power = 0, danger = 0, wave = 0}) => {
  const color = danger > 0.5 ? T.signalRed : T.amber;
  const needle = 40 + Math.sin(frame * 0.05) * 3 * power + power * 150;
  const pts = [...Array(40)].map((_, i) => {
    const x = 120 + i * 5;
    const amp = wave * 26 * Math.sin(i * 0.8 + frame * 0.9) * Math.sin(i * 0.17 + frame * 0.31) + (power ? Math.sin(i * 2.7 + frame * 2) * 2 : 0);
    return `${x},${108 + amp}`;
  });
  return (
    <g>
      <defs>
        <radialGradient id="radioGlow">
          <stop offset="0" stopColor={color} stopOpacity="0.8" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {power > 0 ? <ellipse cx={180} cy={100} rx={330} ry={240} fill="url(#radioGlow)" opacity={0.45 * power} style={{mixBlendMode: 'screen'}} /> : null}
      <rect x={0} y={0} width={360} height={220} rx={16} fill="#2b2a33" stroke="#47454f" strokeWidth={5} />
      <rect x={10} y={10} width={340} height={22} rx={6} fill="#3a3843" />
      {/* speaker grille */}
      {[...Array(6)].map((_, i) => (
        <line key={i} x1={24} y1={58 + i * 18} x2={94} y2={58 + i * 18} stroke="#1a1920" strokeWidth={7} strokeLinecap="round" />
      ))}
      {/* display */}
      <rect x={110} y={50} width={220} height={110} rx={8} fill="#120f0c" />
      <rect x={110} y={50} width={220} height={110} rx={8} fill={color} opacity={0.18 * power} />
      <text x={220} y={84} fill={color} opacity={0.2 + 0.8 * power} fontFamily={T.mono} fontWeight={700} fontSize={30} textAnchor="middle">
        114.7
      </text>
      {power > 0 ? <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={3} opacity={power} /> : null}
      {/* tuning scale + needle */}
      <line x1={120} y1={140} x2={320} y2={140} stroke={color} strokeWidth={2} opacity={0.3 + 0.5 * power} />
      {[...Array(11)].map((_, i) => (
        <line key={i} x1={120 + i * 20} y1={134} x2={120 + i * 20} y2={146} stroke={color} strokeWidth={2} opacity={0.3 + 0.5 * power} />
      ))}
      <line x1={120 + needle} y1={128} x2={120 + needle} y2={152} stroke={T.signalRed} strokeWidth={4} />
      {/* knobs */}
      <circle cx={50} cy={188} r={18} fill="#17161c" stroke="#5a5862" strokeWidth={3} />
      <line x1={50} y1={188} x2={50 + Math.cos(frame * 0.02 * power) * 14} y2={188 + Math.sin(frame * 0.02 * power) * 14} stroke="#aaa" strokeWidth={3} />
      <circle cx={300} cy={188} r={22} fill="#17161c" stroke="#5a5862" strokeWidth={3} />
      <circle cx={250} cy={190} r={7} fill={power > 0 ? color : '#3a2020'} />
      {/* antenna */}
      <line x1={330} y1={0} x2={380} y2={-160} stroke="#8a8794" strokeWidth={5} />
      <circle cx={380} cy={-160} r={6} fill={power > 0 ? color : '#555'} />
    </g>
  );
};
