import React from 'react';
import {T} from '../theme';

/**
 * VANCE HOUSE: FRONT HALLWAY (14 Maple Street, ground floor). World coordinates 2000 x 1920.
 *   Front door:   doorway x 1150–1500, y 520–1500 (opens inward, hinge on the right)
 *   Threshold:    y 1500 (an Echo cannot cross it uninvited; `barrier` makes the plane visible)
 *   Staircase:    rises from bottom-left (x 80, y 1500) to the landing (x 720, y 760)
 *   Mirror:       oval at x 880, y 860 (an Echo has NO reflection: mirror shows the doorway empty)
 *   Coat hooks:   Dad's navy hoodie still hangs there
 */
export const ENTRY = {
  door: {x: 1150, y: 520, w: 350, h: 980},
  floorY: 1500,
  stairs: {x0: 80, y0: 1500, x1: 720, y1: 760, steps: 9},
  mirror: {x: 880, y: 860, rx: 90, ry: 130},
};

/** y of the stair tread under a given x (for placing characters on the stairs) */
export const stairY = (x: number) => {
  const s = ENTRY.stairs;
  const k = Math.max(0, Math.min(1, (x - s.x0) / (s.x1 - s.x0)));
  const step = Math.floor(k * s.steps);
  return s.y0 - (step * (s.y0 - s.y1)) / s.steps;
};

export type EntryProps = {
  frame: number;
  doorOpen?: number; // 0 closed .. 1 open
  outside?: React.ReactNode; // drawn in the doorway (porch, behind the frame)
  dryAround?: {x: number; y: number; r: number} | null; // rain masked around a dry Echo on the porch
  barrier?: number; // 0..1 shimmering plane in the doorway
  lightning?: number;
  redFromUpstairs?: number; // 0..1 red radio glow spilling down the stairs
};

export const Entry: React.FC<EntryProps> = ({frame, doorOpen = 0, outside, dryAround = null, barrier = 0, lightning = 0, redFromUpstairs = 0}) => {
  const D = ENTRY.door;
  const S = ENTRY.stairs;
  const M = ENTRY.mirror;
  const stepH = (S.y0 - S.y1) / S.steps;
  const stepW = (S.x1 - S.x0) / S.steps;
  const rain = [...Array(60)].map((_, i) => {
    const x = D.x - 40 + ((i * 47.3) % (D.w + 80));
    const y = D.y - 100 + ((i * 113.7 + frame * 42) % (D.h + 200));
    return {x, y, i};
  });
  return (
    <g>
      <defs>
        <linearGradient id="entryWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2230" />
          <stop offset="1" stopColor="#222c3d" />
        </linearGradient>
        <linearGradient id="porchSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070a16" />
          <stop offset="1" stopColor="#141c38" />
        </linearGradient>
        <clipPath id="entryDoorClip">
          <rect x={D.x} y={D.y} width={D.w} height={D.h} />
        </clipPath>
        <clipPath id="mirrorClip">
          <ellipse cx={M.x} cy={M.y} rx={M.rx} ry={M.ry} />
        </clipPath>
        <mask id="entryDryMask">
          <rect x={0} y={0} width={2000} height={1920} fill="#fff" />
          {dryAround ? <ellipse cx={dryAround.x} cy={dryAround.y} rx={dryAround.r} ry={dryAround.r * 1.3} fill="#000" /> : null}
        </mask>
        <linearGradient id="barrierG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9fd8ff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#cfefff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#9fd8ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* wall with faint vertical wallpaper stripes */}
      <rect x={-600} y={-400} width={3200} height={2000} fill="url(#entryWall)" />
      {[...Array(40)].map((_, i) => (
        <rect key={i} x={-600 + i * 80} y={-400} width={22} height={1900} fill="#26314a" opacity={0.35} />
      ))}
      <rect x={-600} y={1300} width={3200} height={200} fill="#1a2030" />
      <rect x={-600} y={1296} width={3200} height={10} fill="#2c3550" />

      {/* doorway: porch + rainy night */}
      <g clipPath="url(#entryDoorClip)">
        <rect x={D.x} y={D.y} width={D.w} height={D.h} fill="url(#porchSky)" />
        <path d={`M ${D.x} ${D.y + 640} Q ${D.x + 175} ${D.y + 600} ${D.x + D.w} ${D.y + 650} L ${D.x + D.w} ${D.y + D.h} L ${D.x} ${D.y + D.h} Z`} fill="#0b1310" />
        <path d={`M ${D.x + 40} ${D.y + 640} L ${D.x + 40} ${D.y + 320} M ${D.x + 40} ${D.y + 420} L ${D.x - 20} ${D.y + 340} M ${D.x + 40} ${D.y + 470} L ${D.x + 110} ${D.y + 380}`} stroke="#05070c" strokeWidth={14} strokeLinecap="round" />
        {/* porch boards */}
        <rect x={D.x} y={D.y + 820} width={D.w} height={D.h - 820} fill="#2a2430" />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={D.x} y1={D.y + 850 + i * 36} x2={D.x + D.w} y2={D.y + 850 + i * 36} stroke="#1c1822" strokeWidth={4} />
        ))}
        {/* porch post */}
        <rect x={D.x + D.w - 50} y={D.y} width={26} height={820} fill="#151320" />
        {outside}
        <g mask="url(#entryDryMask)">
          {rain.map(({x, y, i}) => (
            <line key={i} x1={x} y1={y} x2={x - 8} y2={y + 56} stroke="#a9c0ee" strokeWidth={3} opacity={0.45} />
          ))}
        </g>
        {dryAround
          ? [...Array(16)].map((_, i) => {
              const a = Math.PI * (1.08 + (i / 15) * 0.84);
              const t = (frame * 0.15 + i * 0.41) % 1;
              const x = dryAround.x + Math.cos(a) * dryAround.r;
              const y = dryAround.y + Math.sin(a) * dryAround.r * 1.3;
              return <circle key={i} cx={x + Math.cos(a) * t * 18} cy={y + Math.sin(a) * t * 18} r={5 * (1 - t) + 1.5} fill="#e2ecff" opacity={0.9 * (1 - t)} />;
            })
          : null}
        {lightning > 0 ? <rect x={D.x} y={D.y} width={D.w} height={D.h} fill="#e6eeff" opacity={lightning * 0.85} /> : null}
      </g>
      {/* the invisible wall */}
      {barrier > 0 ? (
        <g style={{mixBlendMode: 'screen'}} opacity={barrier}>
          <rect x={D.x} y={D.y} width={D.w} height={D.h} fill="url(#barrierG)" opacity={0.5} />
          {[...Array(6)].map((_, i) => {
            const y = D.y + ((i * 170 + frame * 9) % D.h);
            return <path key={i} d={`M ${D.x} ${y} Q ${D.x + D.w / 2} ${y + 30 * Math.sin(frame * 0.4 + i)} ${D.x + D.w} ${y}`} stroke="#d9f2ff" strokeWidth={4} fill="none" opacity={0.7} />;
          })}
          <rect x={D.x} y={D.y + D.h - 8} width={D.w} height={8} fill="#d9f2ff" />
        </g>
      ) : null}
      {/* door frame + door (hinge on the right, swings inward) */}
      <rect x={D.x - 26} y={D.y - 26} width={D.w + 52} height={D.h + 26} fill="none" stroke="#3a3048" strokeWidth={26} />
      <g transform={`translate(${D.x + D.w} ${D.y}) scale(${-Math.cos(doorOpen * 1.4)} 1)`}>
        <rect x={0} y={0} width={D.w} height={D.h} fill="#4a2f3a" />
        <rect x={40} y={60} width={D.w - 80} height={180} rx={10} fill="#1d2a44" opacity={0.85} />
        <rect x={40} y={300} width={D.w - 80} height={300} rx={8} fill="none" stroke="#3a2430" strokeWidth={12} />
        <rect x={40} y={650} width={D.w - 80} height={280} rx={8} fill="none" stroke="#3a2430" strokeWidth={12} />
        <circle cx={D.w - 46} cy={520} r={15} fill="#b9a77a" />
        <rect x={D.w - 54} y={470} width={16} height={22} rx={4} fill="#8d7f5c" />
      </g>
      {/* doormat at the threshold */}
      <rect x={D.x + 30} y={D.y + D.h - 6} width={D.w - 60} height={18} rx={4} fill="#3a2a22" />

      {/* mirror: shows the doorway… but never an Echo */}
      <g>
        <ellipse cx={M.x} cy={M.y} rx={M.rx + 16} ry={M.ry + 16} fill="#6b5a3a" />
        <g clipPath="url(#mirrorClip)">
          <rect x={M.x - M.rx} y={M.y - M.ry} width={M.rx * 2} height={M.ry * 2} fill="#1b2436" />
          {/* reflected doorway (mirrored, empty) */}
          <rect x={M.x - 70} y={M.y - 90} width={70} height={220} fill="url(#porchSky)" opacity={doorOpen} />
          <rect x={M.x - 74} y={M.y - 94} width={78} height={228} fill="none" stroke="#3a3048" strokeWidth={8} opacity={doorOpen} />
          {[...Array(6)].map((_, i) => (
            <line key={i} x1={M.x - 60 + i * 10} y1={M.y - 80 + ((i * 37 + frame * 6) % 200)} x2={M.x - 62 + i * 10} y2={M.y - 68 + ((i * 37 + frame * 6) % 200)} stroke="#a9c0ee" strokeWidth={2} opacity={0.5 * doorOpen} />
          ))}
          <path d={`M ${M.x - M.rx} ${M.y - M.ry} L ${M.x + 20} ${M.y - M.ry} L ${M.x - M.rx} ${M.y + 40} Z`} fill="#fff" opacity={0.06} />
        </g>
      </g>

      {/* coat hooks with Dad's navy hoodie, framed family photo */}
      <rect x={1600} y={760} width={260} height={16} rx={6} fill="#4d3a34" />
      <path d="M 1660 776 C 1620 820 1610 1000 1640 1080 L 1720 1080 C 1740 1000 1720 820 1690 776 Z" fill="#3e4f6b" />
      <path d="M 1640 800 Q 1675 840 1710 800" stroke="#2f3c54" strokeWidth={8} fill="none" />
      <circle cx={1800} cy={790} r={14} fill="#a8472a" />
      <g transform="rotate(2 1730 600)">
        <rect x={1640} y={500} width={180} height={140} fill="#6b5a3a" />
        <rect x={1652} y={512} width={156} height={116} fill="#2b3a55" />
        {[1680, 1720, 1765].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy={560 - i * 2} r={14 - (i === 2 ? 4 : 0)} fill="#f0c4a0" />
            <rect x={x - 12} y={574 - i * 2} width={24} height={36} fill={['#3e4f6b', '#e9b72f', '#2c3a66'][i]} />
          </g>
        ))}
      </g>

      {/* floor */}
      <rect x={-600} y={ENTRY.floorY} width={3200} height={700} fill="#211a20" />
      {[...Array(14)].map((_, i) => (
        <line key={i} x1={-600 + i * 260} y1={ENTRY.floorY} x2={-1000 + i * 340} y2={2200} stroke="#2c2329" strokeWidth={4} />
      ))}
      <ellipse cx={980} cy={1650} rx={380} ry={70} fill="#3b2c3a" />

      {/* staircase */}
      <path d={`M ${S.x0 - 200} ${S.y0} L ${S.x0} ${S.y0} ${[...Array(S.steps)].map((_, i) => `L ${S.x0 + i * stepW} ${S.y0 - (i + 1) * stepH} L ${S.x0 + (i + 1) * stepW} ${S.y0 - (i + 1) * stepH}`).join(' ')} L ${S.x1 + 60} ${S.y1} L ${S.x1 + 60} ${S.y1 - 30} L ${S.x0 - 200} ${S.y1 - 30} Z`} fill="#3a2c34" />
      {[...Array(S.steps)].map((_, i) => (
        <line key={i} x1={S.x0 + i * stepW} y1={S.y0 - (i + 1) * stepH} x2={S.x0 + (i + 1) * stepW} y2={S.y0 - (i + 1) * stepH} stroke="#544050" strokeWidth={6} />
      ))}
      {/* banister */}
      <line x1={S.x0 + 30} y1={S.y0 - 260} x2={S.x1 + 40} y2={S.y1 - 260} stroke="#5a4338" strokeWidth={16} strokeLinecap="round" />
      {[...Array(S.steps)].map((_, i) => (
        <line key={i} x1={S.x0 + 40 + i * stepW} y1={S.y0 - (i + 1) * stepH} x2={S.x0 + 40 + i * stepW} y2={S.y0 - 260 - (i * stepH * (S.y0 - S.y1)) / (S.steps * stepH)} stroke="#4a372e" strokeWidth={8} />
      ))}
      {/* red radio light spilling from upstairs */}
      {redFromUpstairs > 0 ? (
        <g style={{mixBlendMode: 'screen'}}>
          <circle cx={S.x1 - 40} cy={S.y1 - 260} r={520} fill="url(#gRed)" opacity={redFromUpstairs} />
          <path d={`M ${S.x1 - 200} ${S.y1 - 400} L ${S.x1 + 100} ${S.y1 - 400} L ${S.x0 + 300} ${S.y0} L ${S.x0 - 100} ${S.y0} Z`} fill={T.signalRed} opacity={0.12 * redFromUpstairs} />
        </g>
      ) : null}
    </g>
  );
};
