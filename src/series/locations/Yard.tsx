import React from 'react';
import {T} from '../theme';

/**
 * THE VANCE FRONT YARD (14 Maple Street), seen from Nora's attic window, looking DOWN.
 * Screen-space component (1080 x 1920). High angle: porch roof edge at the bottom, lawn + stone path
 * in the middle, picket fence, mailbox "14" and the dark street at the top.
 *
 * `figure` is drawn on the lawn. `dryAround` = {x, y, r}: rain is masked out inside that circle and
 * drops splash on an invisible dome (the Echo tell: Echoes never get wet).
 */
export const Yard: React.FC<{
  frame: number;
  figure?: React.ReactNode;
  dryAround?: {x: number; y: number; r: number} | null;
  lightning?: number;
  streetlightOn?: boolean;
}> = ({frame, figure, dryAround = null, lightning = 0, streetlightOn = false}) => {
  const drops = [...Array(140)].map((_, i) => {
    const x = (i * 83.7) % 1180 - 50;
    const y = ((i * 131.3 + frame * 46) % 2060) - 120;
    return {x, y, i};
  });
  return (
    <g>
      <defs>
        <linearGradient id="lawnG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1a17" />
          <stop offset="1" stopColor="#15261f" />
        </linearGradient>
        <mask id="dryMask">
          <rect x={-100} y={-100} width={1300} height={2200} fill="#fff" />
          {dryAround ? <ellipse cx={dryAround.x} cy={dryAround.y} rx={dryAround.r} ry={dryAround.r * 1.25} fill="#000" /> : null}
        </mask>
      </defs>
      {/* street */}
      <rect x={-100} y={-100} width={1300} height={420} fill="#0b0d16" />
      <line x1={-100} y1={170} x2={1200} y2={170} stroke="#2a2d3a" strokeWidth={6} strokeDasharray="60 50" />
      {/* dead streetlight (blackout) */}
      <line x1={860} y1={320} x2={860} y2={40} stroke="#05060b" strokeWidth={14} />
      <path d="M 860 40 L 800 40" stroke="#05060b" strokeWidth={10} />
      <circle cx={800} cy={50} r={12} fill={streetlightOn ? '#ffe2a8' : '#1a1c24'} />
      {/* lawn */}
      <rect x={-100} y={300} width={1300} height={1800} fill="url(#lawnG)" />
      {/* picket fence */}
      {[...Array(24)].map((_, i) => (
        <rect key={i} x={-60 + i * 52} y={300} width={22} height={70} fill="#2a3040" />
      ))}
      <rect x={-100} y={326} width={1300} height={10} fill="#2a3040" />
      {/* gate gap + path */}
      <rect x={470} y={290} width={140} height={90} fill="#0d1a17" />
      <path d="M 470 340 L 610 340 L 700 1700 L 380 1700 Z" fill="#20242e" />
      {[...Array(9)].map((_, i) => (
        <ellipse key={i} cx={540 + i * 6} cy={420 + i * 150} rx={60 + i * 9} ry={22 + i * 3} fill="#2c313d" />
      ))}
      {/* mailbox 14 */}
      <rect x={300} y={300} width={12} height={110} fill="#1a1d28" />
      <rect x={270} y={270} width={74} height={44} rx={18} fill="#3a2f45" />
      <text x={307} y={302} fill="#c9b8e0" fontFamily={T.font} fontWeight={800} fontSize={24} textAnchor="middle">
        14
      </text>
      {/* puddles */}
      {[[220, 900, 120], [820, 1200, 90], [300, 1400, 140]].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.35} fill="#1d2a44" />
          {[0, 1].map((k) => {
            const t = ((frame * 0.05 + i * 0.3 + k * 0.5) % 1);
            return <ellipse key={k} cx={x + (k ? 30 : -20)} cy={y} rx={t * r * 0.6} ry={t * r * 0.2} fill="none" stroke="#8aa6d8" strokeWidth={2} opacity={0.6 * (1 - t)} />;
          })}
        </g>
      ))}
      {figure}
      {/* rain (masked around the dry figure) */}
      <g mask="url(#dryMask)">
        {drops.map(({x, y, i}) => (
          <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 70} stroke="#a9c0ee" strokeWidth={3} opacity={0.4} />
        ))}
        {/* splashes on the ground */}
        {[...Array(40)].map((_, i) => {
          const t = ((frame * 0.12 + i * 0.37) % 1);
          const x = (i * 157.3) % 1080;
          const y = 380 + ((i * 211.7) % 1500);
          return <ellipse key={i} cx={x} cy={y} rx={4 + t * 14} ry={2 + t * 5} fill="none" stroke="#a9c0ee" strokeWidth={2} opacity={0.5 * (1 - t)} />;
        })}
      </g>
      {/* drops splashing on the invisible dome around the dry figure */}
      {dryAround
        ? [...Array(28)].map((_, i) => {
            const a = Math.PI * (1.05 + (i / 27) * 0.9); // upper arc
            const t = ((frame * 0.15 + i * 0.41) % 1);
            const x = dryAround.x + Math.cos(a) * dryAround.r;
            const y = dryAround.y + Math.sin(a) * dryAround.r * 1.25;
            return <circle key={i} cx={x + Math.cos(a) * t * 22} cy={y + Math.sin(a) * t * 22} r={6 * (1 - t) + 2} fill="#e2ecff" opacity={0.95 * (1 - t)} />;
          })
        : null}
      {dryAround ? (
        <ellipse cx={dryAround.x} cy={dryAround.y} rx={dryAround.r} ry={dryAround.r * 1.25} fill="none" stroke="#cfe0ff" strokeWidth={4} opacity={0.22 + 0.1 * Math.sin(frame * 0.3)} />
      ) : null}
      {/* porch roof edge in the foreground (we look over it) */}
      <path d="M -100 1760 L 1200 1700 L 1200 2100 L -100 2100 Z" fill="#141a30" />
      {[...Array(12)].map((_, i) => (
        <line key={i} x1={-100 + i * 120} y1={1760 - i * 5} x2={-140 + i * 130} y2={2100} stroke="#0e1326" strokeWidth={6} />
      ))}
      <path d="M -100 1760 L 1200 1700" stroke="#2a3150" strokeWidth={10} />
      {lightning > 0 ? <rect x={-100} y={-100} width={1300} height={2200} fill="#e6eeff" opacity={lightning * 0.7} /> : null}
    </g>
  );
};
