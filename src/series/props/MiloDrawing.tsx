import React from 'react';
import {T} from '../theme';

/**
 * Milo's crayon drawing (Chapter 1 clue). Local size 800 x 620, origin top-left.
 * Shows the attic: dormer window, Nora (yellow coat), Theo (green, glasses) by the window,
 * and a black scribbled figure with white eyes standing behind Theo. "11:47" in the corner.
 */
const wob = (d: string) => d; // paths are already hand-wobbly

/**
 * Page 2 (Chapter 2 clue): the "boy" from page 1 up close: Theo's glasses and spiky hair,
 * scribbled black, holding a glowing phone that reads 11:47. Rain everywhere except on him.
 * Milo wrote: "he dosnt get wet".
 */
export const MiloDrawingPage2: React.FC<{frame: number; glow?: number}> = ({frame, glow = 0}) => {
  const jitter = (i: number) => Math.sin(frame * 0.8 + i) * 0.6;
  const crayon = {strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};
  return (
    <g>
      <rect x={0} y={0} width={800} height={620} fill="#f3ecd9" />
      {[...Array(14)].map((_, i) => (
        <line key={i} x1={0} y1={60 + i * 42} x2={800} y2={60 + i * 42} stroke="#b9cbe6" strokeWidth={2} />
      ))}
      <line x1={80} y1={0} x2={80} y2={620} stroke="#e8a3a3" strokeWidth={3} />
      {[...Array(8)].map((_, i) => (
        <circle key={i} cx={30} cy={40 + i * 75} r={10} fill="#d8cfb8" />
      ))}
      <g transform={`translate(${jitter(1)} ${jitter(2)})`}>
        {/* rain everywhere… */}
        {[...Array(60)].map((_, i) => {
          const x = 100 + ((i * 61) % 680);
          const y = 30 + ((i * 97) % 560);
          const dx = x - 430;
          const dy = y - 330;
          if (dx * dx + dy * dy < 200 * 200) return null; // …except around him
          return <line key={i} x1={x} y1={y} x2={x - 8} y2={y + 26} stroke="#5d8de0" strokeWidth={4} strokeLinecap="round" />;
        })}
        <circle cx={430} cy={330} r={190} stroke="#5d8de0" strokeWidth={3} strokeDasharray="10 14" fill="none" />
        {/* the boy: black scribble with Theo's hair and glasses */}
        <g transform="translate(430 300)">
          {[...Array(14)].map((_, i) => (
            <path key={i} d={`M ${-50 + (i % 4) * 8} ${20 + i * 14} C 60 ${30 + i * 14} -60 ${40 + i * 14} ${52 - (i % 3) * 6} ${50 + i * 14}`} stroke="#0b0a0e" strokeWidth={8} {...crayon} />
          ))}
          <circle cx={0} cy={-40} r={62} fill="#0b0a0e" />
          <path d="M -60 -70 L -54 -118 L -30 -92 L -10 -130 L 10 -94 L 34 -124 L 40 -88 L 66 -96 L 58 -64" stroke="#0b0a0e" strokeWidth={14} {...crayon} />
          <circle cx={-24} cy={-44} r={20} stroke="#ffffff" strokeWidth={5} fill="none" />
          <circle cx={24} cy={-44} r={20} stroke="#ffffff" strokeWidth={5} fill="none" />
          <circle cx={-24} cy={-44} r={5} fill="#fff" />
          <circle cx={24} cy={-44} r={5} fill="#fff" />
          {/* phone */}
          <g transform="translate(70 90) rotate(12)">
            <circle cx={0} cy={0} r={70} fill={T.phone} opacity={0.25 + 0.35 * glow} />
            <rect x={-30} y={-48} width={60} height={96} rx={8} fill="#1a1d2b" />
            <rect x={-24} y={-40} width={48} height={80} rx={4} fill={T.phone} />
            <text x={0} y={8} fill="#0b0a0e" fontFamily="'Comic Sans MS', 'Segoe Print', cursive" fontWeight={700} fontSize={20} textAnchor="middle">
              11:47
            </text>
          </g>
        </g>
        <text x={110} y={110} fill={T.signalRed} fontFamily="'Comic Sans MS', 'Segoe Print', cursive" fontWeight={700} fontSize={46} transform="rotate(-6 110 110)">
          he dosnt get wet
        </text>
        <text x={560} y={590} fill="#555" fontFamily="'Comic Sans MS', 'Segoe Print', cursive" fontSize={30} transform="rotate(-3 560 590)">
          by Milo
        </text>
      </g>
    </g>
  );
};

export const MiloDrawing: React.FC<{frame: number; figureGlow?: number}> = ({frame, figureGlow = 0}) => {
  const jitter = (i: number) => Math.sin(frame * 0.8 + i) * 0.6;
  const crayon = {strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};
  return (
    <g>
      <rect x={0} y={0} width={800} height={620} fill="#f3ecd9" />
      {[...Array(14)].map((_, i) => (
        <line key={i} x1={0} y1={60 + i * 42} x2={800} y2={60 + i * 42} stroke="#b9cbe6" strokeWidth={2} />
      ))}
      <line x1={80} y1={0} x2={80} y2={620} stroke="#e8a3a3" strokeWidth={3} />
      {/* spiral holes */}
      {[...Array(8)].map((_, i) => (
        <circle key={i} cx={30} cy={40 + i * 75} r={10} fill="#d8cfb8" />
      ))}
      <g transform={`translate(${jitter(1)} ${jitter(2)})`}>
        {/* roof slopes */}
        <path d={wob('M 110 330 L 300 120 L 560 118 L 760 330')} stroke="#4a3f6a" strokeWidth={9} {...crayon} />
        {/* window with rain */}
        <path d="M 360 160 L 500 158 L 502 330 L 358 332 Z" stroke="#2e3f8a" strokeWidth={8} {...crayon} />
        <path d="M 430 160 L 430 330 M 360 245 L 500 245" stroke="#2e3f8a" strokeWidth={6} {...crayon} />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={372 + i * 26} y1={175 + (i % 2) * 30} x2={366 + i * 26} y2={200 + (i % 2) * 30} stroke="#5d8de0" strokeWidth={4} />
        ))}
        {/* radio on desk */}
        <path d="M 600 400 L 740 400 M 620 400 L 620 520 M 720 400 L 720 520" stroke="#6b4a2a" strokeWidth={8} {...crayon} />
        <rect x={630} y={340} width={90} height={58} fill="#55505e" />
        <circle cx={700} cy={368} r={9} fill={T.amber} />
        {/* NORA: yellow coat, red ponytail */}
        <g transform="translate(250 360)">
          <circle cx={0} cy={0} r={34} fill="#f0c4a0" stroke="#7a301c" strokeWidth={3} />
          <path d="M -30 -14 C -30 -46 30 -46 30 -14" stroke="#a8472a" strokeWidth={14} {...crayon} />
          <path d="M 28 -24 C 56 -20 60 10 50 30" stroke="#a8472a" strokeWidth={12} {...crayon} />
          <circle cx={-11} cy={0} r={4} fill="#222" />
          <circle cx={11} cy={0} r={4} fill="#222" />
          <path d="M -30 40 L 30 40 L 44 170 L -44 170 Z" fill="#e9b72f" stroke="#c4931c" strokeWidth={4} />
          <path d="M -20 170 L -20 230 M 20 170 L 20 230" stroke="#2b3350" strokeWidth={10} {...crayon} />
        </g>
        {/* THEO: green jacket, glasses, at the window */}
        <g transform="translate(470 380)">
          <circle cx={0} cy={0} r={34} fill="#e8c09a" stroke="#3b512b" strokeWidth={3} />
          <path d="M -32 -18 L -26 -44 L -10 -30 L 0 -50 L 12 -30 L 28 -46 L 32 -16" stroke="#17141d" strokeWidth={8} {...crayon} />
          <circle cx={-12} cy={-2} r={11} stroke="#17141d" strokeWidth={4} fill="none" />
          <circle cx={12} cy={-2} r={11} stroke="#17141d" strokeWidth={4} fill="none" />
          <path d="M -32 40 L 32 40 L 40 160 L -40 160 Z" fill="#4f6a3a" stroke="#3b512b" strokeWidth={4} />
          <path d="M -18 160 L -18 220 M 18 160 L 18 220" stroke="#23262f" strokeWidth={10} {...crayon} />
        </g>
        {/* THE FIGURE behind Theo: black scribble */}
        <g transform="translate(545 350)">
          <circle cx={0} cy={0} r={110} fill={T.signalRed} opacity={0.15 * figureGlow} />
          {[...Array(16)].map((_, i) => (
            <path
              key={i}
              d={`M ${-30 + (i % 4) * 6} ${-60 + i * 14} C ${40} ${-50 + i * 14} ${-40} ${-40 + i * 14} ${34 - (i % 3) * 5} ${-30 + i * 14}`}
              stroke="#0b0a0e"
              strokeWidth={7}
              {...crayon}
            />
          ))}
          <circle cx={0} cy={-62} r={38} fill="#0b0a0e" />
          <circle cx={-12} cy={-66} r={6} fill="#fff" />
          <circle cx={12} cy={-66} r={6} fill="#fff" />
        </g>
        {/* 11:47 */}
        <text x={110} y={110} fill={T.signalRed} fontFamily="'Comic Sans MS', 'Segoe Print', cursive" fontWeight={700} fontSize={64} transform="rotate(-6 110 110)">
          11:47
        </text>
        <text x={560} y={590} fill="#555" fontFamily="'Comic Sans MS', 'Segoe Print', cursive" fontSize={30} transform="rotate(-3 560 590)">
          by Milo
        </text>
      </g>
    </g>
  );
};
