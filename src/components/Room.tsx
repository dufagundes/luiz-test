import React from 'react';
import {COLORS} from '../lib/constants';

/**
 * Maya's bedroom, drawn once in "world" coordinates (2400 x 1920) and reused by every
 * interior scene so the set stays consistent. Cameras frame different parts of it.
 *
 *   Door:        x 200–620,  y 520–1450 (hinge on the left)
 *   Bed:         x 900–1700, mattress top y 1180
 *   Nightstand:  x 1740–1950
 *   Window:      x 1990–2350, y 450–1050
 */
export const WORLD = {w: 2400, h: 1920, floorY: 1450};
export const DOOR = {x: 200, y: 520, w: 420, h: 930};
export const WINDOW = {x: 1990, y: 450, w: 360, h: 600};
export const PHONE_SPOT = {x: 1800, y: 1158};

export type RoomProps = {
  frame: number;
  doorOpen?: number; // 0 closed .. 1 wide open
  doorShake?: number; // px
  handleTurn?: number; // degrees
  hallLight?: number; // 0..1 warm light behind the door
  underDoor?: number; // 0..1 light strip under the door
  feet?: number; // 0..1 shadow of feet under the door
  moon?: number; // moonlight intensity 0..1
  lightning?: number; // 0..1 flash through the window
  doorway?: React.ReactNode; // drawn inside the open doorway (behind the door panel)
  outside?: React.ReactNode; // drawn inside the window (behind the glass)
  phoneGlow?: number; // glow of the phone on the nightstand
  showPhone?: boolean;
};

export const Defs: React.FC = () => (
  <defs>
    <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#141b2e" />
      <stop offset="1" stopColor={COLORS.wall} />
    </linearGradient>
    <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#1b2236" />
      <stop offset="1" stopColor="#0d1120" />
    </linearGradient>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#060a1a" />
      <stop offset="0.7" stopColor="#1a2550" />
      <stop offset="1" stopColor="#2b2f5c" />
    </linearGradient>
    <linearGradient id="hallGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffd59a" />
      <stop offset="1" stopColor="#d98a3e" />
    </linearGradient>
    <linearGradient id="beamGrad" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={COLORS.moon} stopOpacity="0.32" />
      <stop offset="1" stopColor={COLORS.moon} stopOpacity="0" />
    </linearGradient>
    <linearGradient id="hallBeam" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0" stopColor="#ffc47a" stopOpacity="0.75" />
      <stop offset="1" stopColor="#ffc47a" stopOpacity="0" />
    </linearGradient>
    <radialGradient id="phoneGlow">
      <stop offset="0" stopColor={COLORS.phone} stopOpacity="0.9" />
      <stop offset="0.35" stopColor={COLORS.phone} stopOpacity="0.35" />
      <stop offset="1" stopColor={COLORS.phone} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="warmGlow">
      <stop offset="0" stopColor="#ffbe73" stopOpacity="0.9" />
      <stop offset="1" stopColor="#ffbe73" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="redGlow">
      <stop offset="0" stopColor={COLORS.danger} stopOpacity="0.8" />
      <stop offset="1" stopColor={COLORS.danger} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="moonGlow">
      <stop offset="0" stopColor="#e6f0ff" stopOpacity="0.9" />
      <stop offset="0.3" stopColor="#a8c4ff" stopOpacity="0.25" />
      <stop offset="1" stopColor="#a8c4ff" stopOpacity="0" />
    </radialGradient>
    <clipPath id="windowClip">
      <rect x={WINDOW.x} y={WINDOW.y} width={WINDOW.w} height={WINDOW.h} />
    </clipPath>
    <clipPath id="doorwayClip">
      <rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={DOOR.h} />
    </clipPath>
  </defs>
);

/** Night view behind the window: sky, moon, trees, neighbour house, street light, driveway */
export const OutsideView: React.FC<{frame: number; lightning?: number; ox?: number; oy?: number; s?: number; children?: React.ReactNode}> = ({
  frame,
  lightning = 0,
  ox = WINDOW.x,
  oy = WINDOW.y,
  s = 1,
  children,
}) => {
  const sway = Math.sin(frame * 0.05) * 3;
  return (
    <g transform={`translate(${ox} ${oy}) scale(${s})`}>
      <rect x={-40} y={-40} width={440} height={700} fill="url(#skyGrad)" />
      {/* stars */}
      {[...Array(14)].map((_, i) => (
        <circle
          key={i}
          cx={(i * 97) % 360}
          cy={(i * 53) % 220}
          r={1.6 + (i % 3) * 0.6}
          fill="#dfe8ff"
          opacity={0.4 + 0.4 * Math.abs(Math.sin(frame * 0.05 + i))}
        />
      ))}
      <circle cx={280} cy={90} r={70} fill="url(#moonGlow)" />
      <circle cx={280} cy={90} r={28} fill="#eef3ff" />
      <circle cx={270} cy={84} r={6} fill="#cfd8ef" />
      {/* neighbour house */}
      <path d="M 10 330 L 110 260 L 210 330 L 210 460 L 10 460 Z" fill="#0d1226" />
      <rect x={60} y={360} width={34} height={38} fill="#3a3320" opacity={0.6} />
      {/* trees */}
      <g transform={`rotate(${sway * 0.4} 330 600)`}>
        <path d="M 330 600 L 330 360" stroke="#070a14" strokeWidth={16} />
        <circle cx={330} cy={320} r={70} fill="#070a14" />
        <circle cx={290} cy={360} r={50} fill="#070a14" />
        <circle cx={370} cy={370} r={55} fill="#070a14" />
      </g>
      {/* lawn + driveway */}
      <rect x={-40} y={440} width={440} height={220} fill="#0a0f1d" />
      <path d="M 120 440 L 230 440 L 330 660 L 40 660 Z" fill="#161b2b" />
      {/* street light */}
      <line x1={60} y1={460} x2={60} y2={300} stroke="#0b0d16" strokeWidth={8} />
      <circle cx={60} cy={300} r={10} fill="#ffe2a8" />
      <path d="M 60 300 L 0 520 L 140 520 Z" fill="#ffd894" opacity={0.12} />
      <ellipse cx={70} cy={520} rx={80} ry={16} fill="#ffd894" opacity={0.12} />
      {/* parked car */}
      <g transform="translate(150 470)">
        <path d="M 0 40 L 10 12 Q 20 0 40 0 L 100 0 Q 118 0 128 14 L 150 22 Q 164 26 164 40 L 164 54 L 0 54 Z" fill="#141a2e" />
        <rect x={34} y={6} width={36} height={20} rx={4} fill="#2a3352" />
        <rect x={76} y={6} width={36} height={20} rx={4} fill="#2a3352" />
        <circle cx={34} cy={56} r={12} fill="#05060c" />
        <circle cx={130} cy={56} r={12} fill="#05060c" />
        <rect x={156} y={34} width={8} height={8} fill="#ff4e5e" opacity={0.6} />
      </g>
      {children}
      {/* lightning flash */}
      <rect x={-40} y={-40} width={440} height={700} fill="#dbe6ff" opacity={lightning * 0.75} />
    </g>
  );
};

export const BedBack: React.FC = () => (
  <g>
    {/* headboard */}
    <rect x={1660} y={930} width={60} height={520} rx={18} fill={COLORS.woodLight} />
    <rect x={880} y={1060} width={40} height={390} rx={14} fill={COLORS.wood} />
    {/* frame */}
    <rect x={890} y={1290} width={820} height={70} rx={12} fill={COLORS.wood} />
    <rect x={900} y={1360} width={26} height={90} fill={COLORS.wood} />
    <rect x={1670} y={1360} width={26} height={90} fill={COLORS.wood} />
    {/* mattress + sheet */}
    <rect x={905} y={1185} width={760} height={115} rx={30} fill="#5b6386" />
    {/* pillow */}
    <rect x={1500} y={1110} width={160} height={90} rx={40} fill="#c8cde0" />
  </g>
);

export const Blanket: React.FC<{frame: number; lift?: number}> = ({frame, lift = 0}) => {
  const b = Math.sin(frame * 0.12) * 3;
  return (
    <g>
      <path
        d={`M 905 ${1215 - lift * 0.3} C 1100 ${1180 - lift + b} 1300 ${1180 - lift * 1.3 + b} 1480 ${1200 - lift * 1.6} L 1500 1320 L 900 1320 Z`}
        fill="#3e4c86"
      />
      <path d={`M 905 1290 L 1500 1290 L 1500 1320 L 900 1320 Z`} fill="#2f3a6a" />
      {/* stars pattern */}
      {[960, 1080, 1210, 1340].map((x, i) => (
        <path key={x} d={`M ${x} ${1240 + (i % 2) * 20} l 6 12 l 13 2 l -10 9 l 3 13 l -12 -7 l -12 7 l 3 -13 l -10 -9 l 13 -2 z`} fill="#8b97cf" opacity={0.45} />
      ))}
    </g>
  );
};

export const Room: React.FC<RoomProps> = ({
  frame,
  doorOpen = 0,
  doorShake = 0,
  handleTurn = 0,
  hallLight = 0,
  underDoor = 0,
  feet = 0,
  moon = 1,
  lightning = 0,
  doorway,
  outside,
  phoneGlow = 0,
  showPhone = true,
}) => {
  const doorScale = Math.cos((doorOpen * Math.PI) / 2.15);
  return (
    <g>
      {/* wall */}
      <rect x={-400} y={-200} width={3200} height={WORLD.floorY + 200} fill="url(#wallGrad)" />
      {/* wainscot line */}
      <rect x={-400} y={1150} width={3200} height={10} fill="#202a44" />
      {/* floor */}
      <rect x={-400} y={WORLD.floorY} width={3200} height={700} fill="url(#floorGrad)" />
      {[...Array(14)].map((_, i) => (
        <line
          key={i}
          x1={-400 + i * 240}
          y1={WORLD.floorY}
          x2={-900 + i * 330}
          y2={2100}
          stroke={COLORS.floorLine}
          strokeWidth={4}
        />
      ))}
      <rect x={-400} y={WORLD.floorY - 14} width={3200} height={18} fill="#0f1424" />

      {/* posters / shelf */}
      <g transform="rotate(-3 780 680)">
        <rect x={700} y={560} width={170} height={230} fill="#2b2547" />
        <circle cx={785} cy={640} r={40} fill="#5a4c8c" />
        <path d="M 720 760 L 760 700 L 790 735 L 820 690 L 850 760 Z" fill="#3f3770" />
      </g>
      <rect x={1000} y={760} width={420} height={18} fill={COLORS.woodLight} />
      {[1020, 1060, 1090, 1140, 1180, 1260, 1300].map((x, i) => (
        <rect key={x} x={x} y={760 - 70 - (i % 3) * 14} width={30 + (i % 2) * 8} height={70 + (i % 3) * 14} fill={['#3c3f6b', '#5c3a52', '#2f5a5a', '#4a4466'][i % 4]} />
      ))}
      <circle cx={1370} cy={732} r={26} fill="#4f6b4f" />

      {/* doorway (seen when door opens) */}
      <g clipPath="url(#doorwayClip)">
        <rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={DOOR.h} fill="#05070d" />
        <rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={DOOR.h} fill="url(#hallGrad)" opacity={hallLight} />
        {doorway}
      </g>
      {/* light spilling from the hallway */}
      {hallLight > 0 ? (
        <path
          d={`M ${DOOR.x} ${DOOR.y + DOOR.h} L ${DOOR.x + DOOR.w} ${DOOR.y + DOOR.h} L ${DOOR.x + DOOR.w + 900} 2000 L ${DOOR.x - 100} 2000 Z`}
          fill="url(#hallBeam)"
          opacity={hallLight}
          style={{mixBlendMode: 'screen'}}
        />
      ) : null}
      {/* door frame */}
      <rect x={DOOR.x - 26} y={DOOR.y - 26} width={DOOR.w + 52} height={DOOR.h + 26} fill="none" stroke="#2e3654" strokeWidth={26} />
      {/* door panel (hinge on the left, opens toward camera) */}
      <g transform={`translate(${DOOR.x + doorShake} ${DOOR.y}) scale(${doorScale} 1)`}>
        <rect x={0} y={0} width={DOOR.w} height={DOOR.h} fill="#2a3150" />
        <rect x={40} y={50} width={DOOR.w - 80} height={360} rx={8} fill="none" stroke="#222842" strokeWidth={14} />
        <rect x={40} y={480} width={DOOR.w - 80} height={390} rx={8} fill="none" stroke="#222842" strokeWidth={14} />
        {/* handle */}
        <g transform={`translate(${DOOR.w - 60} 470) rotate(${handleTurn})`}>
          <circle r={22} fill="#8d8a7a" />
          <rect x={-60} y={-9} width={60} height={18} rx={9} fill="#a9a593" />
        </g>
      </g>
      {/* light under the door + feet shadows */}
      {underDoor > 0 && doorOpen < 0.05 ? (
        <g opacity={underDoor}>
          <rect x={DOOR.x + 10} y={DOOR.y + DOOR.h - 8} width={DOOR.w - 20} height={10} fill="#ffd28c" />
          <path d={`M ${DOOR.x + 10} ${DOOR.y + DOOR.h} L ${DOOR.x + DOOR.w - 10} ${DOOR.y + DOOR.h} L ${DOOR.x + DOOR.w + 160} ${DOOR.y + DOOR.h + 220} L ${DOOR.x - 150} ${DOOR.y + DOOR.h + 220} Z`} fill="#ffc47a" opacity={0.2} />
          {feet > 0 ? (
            <g opacity={feet}>
              <rect x={DOOR.x + 140} y={DOOR.y + DOOR.h - 9} width={50} height={12} fill="#05060a" />
              <rect x={DOOR.x + 230} y={DOOR.y + DOOR.h - 9} width={50} height={12} fill="#05060a" />
              <path d={`M ${DOOR.x + 140} ${DOOR.y + DOOR.h} L ${DOOR.x + 190} ${DOOR.y + DOOR.h} L ${DOOR.x + 215} ${DOOR.y + DOOR.h + 220} L ${DOOR.x + 115} ${DOOR.y + DOOR.h + 220} Z`} fill="#05060a" opacity={0.6} />
              <path d={`M ${DOOR.x + 230} ${DOOR.y + DOOR.h} L ${DOOR.x + 280} ${DOOR.y + DOOR.h} L ${DOOR.x + 320} ${DOOR.y + DOOR.h + 220} L ${DOOR.x + 215} ${DOOR.y + DOOR.h + 220} Z`} fill="#05060a" opacity={0.6} />
            </g>
          ) : null}
        </g>
      ) : null}

      {/* window */}
      <g clipPath="url(#windowClip)">{outside ?? <OutsideView frame={frame} lightning={lightning} />}</g>
      <rect x={WINDOW.x} y={WINDOW.y} width={WINDOW.w} height={WINDOW.h} fill="#9bb7ff" opacity={0.06} />
      <rect x={WINDOW.x - 22} y={WINDOW.y - 22} width={WINDOW.w + 44} height={WINDOW.h + 44} fill="none" stroke="#2c3452" strokeWidth={26} />
      <line x1={WINDOW.x + WINDOW.w / 2} y1={WINDOW.y} x2={WINDOW.x + WINDOW.w / 2} y2={WINDOW.y + WINDOW.h} stroke="#2c3452" strokeWidth={14} />
      <line x1={WINDOW.x} y1={WINDOW.y + WINDOW.h / 2} x2={WINDOW.x + WINDOW.w} y2={WINDOW.y + WINDOW.h / 2} stroke="#2c3452" strokeWidth={14} />
      <rect x={WINDOW.x - 40} y={WINDOW.y + WINDOW.h + 10} width={WINDOW.w + 80} height={24} rx={6} fill="#323b5c" />
      {/* curtains */}
      <path d={`M ${WINDOW.x - 70} ${WINDOW.y - 50} L ${WINDOW.x + 40} ${WINDOW.y - 50} C ${WINDOW.x + 10} ${WINDOW.y + 300} ${WINDOW.x + 50} ${WINDOW.y + 500} ${WINDOW.x - 10} ${WINDOW.y + 760} L ${WINDOW.x - 70} ${WINDOW.y + 760} Z`} fill="#3a2f55" />
      <path d={`M ${WINDOW.x + WINDOW.w + 70} ${WINDOW.y - 50} L ${WINDOW.x + WINDOW.w - 40} ${WINDOW.y - 50} C ${WINDOW.x + WINDOW.w - 10} ${WINDOW.y + 300} ${WINDOW.x + WINDOW.w - 50} ${WINDOW.y + 500} ${WINDOW.x + WINDOW.w + 10} ${WINDOW.y + 760} L ${WINDOW.x + WINDOW.w + 70} ${WINDOW.y + 760} Z`} fill="#3a2f55" />
      <rect x={WINDOW.x - 100} y={WINDOW.y - 64} width={WINDOW.w + 200} height={16} rx={8} fill="#4a4060" />

      {/* moonlight beam across the room */}
      <path
        d={`M ${WINDOW.x} ${WINDOW.y} L ${WINDOW.x + WINDOW.w} ${WINDOW.y + WINDOW.h} L ${WINDOW.x - 300} 2000 L ${WINDOW.x - 1100} 2000 Z`}
        fill="url(#beamGrad)"
        opacity={moon * (1 + lightning * 2)}
        style={{mixBlendMode: 'screen'}}
      />

      <BedBack />

      {/* nightstand + clock + lamp + phone */}
      <rect x={1740} y={1170} width={210} height={280} rx={10} fill={COLORS.wood} />
      <rect x={1760} y={1230} width={170} height={90} rx={6} fill="none" stroke="#211a2c" strokeWidth={6} />
      <circle cx={1845} cy={1275} r={8} fill="#8d8a7a" />
      <rect x={1730} y={1158} width={230} height={18} rx={6} fill={COLORS.woodLight} />
      <g>
        <rect x={1860} y={1100} width={86} height={58} rx={8} fill="#0c0d14" />
        <text x={1903} y={1142} fill={COLORS.danger} fontFamily="'Courier New', monospace" fontWeight={700} fontSize={32} textAnchor="middle">
          3:17
        </text>
        <circle cx={1903} cy={1130} r={70} fill="url(#redGlow)" opacity={0.35} />
      </g>
      <path d="M 1905 1100 L 1905 1010" stroke="#3a3048" strokeWidth={8} />
      <path d="M 1865 1010 L 1945 1010 L 1925 950 L 1885 950 Z" fill="#4b4060" />
      {showPhone ? (
        <g>
          <rect x={PHONE_SPOT.x - 34} y={PHONE_SPOT.y - 8} width={68} height={10} rx={3} fill="#0d0f18" />
          {phoneGlow > 0 ? (
            <ellipse cx={PHONE_SPOT.x} cy={PHONE_SPOT.y - 20} rx={260} ry={200} fill="url(#phoneGlow)" opacity={phoneGlow} style={{mixBlendMode: 'screen'}} />
          ) : null}
        </g>
      ) : null}
    </g>
  );
};
