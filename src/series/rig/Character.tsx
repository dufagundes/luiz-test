import React from 'react';
import {CastMember} from '../cast';

/**
 * THE LAST SIGNAL: shared character rig.
 * Every character in the series is this rig plus a CastMember definition (src/series/cast.ts),
 * so proportions, line style and animation feel identical in every chapter.
 *
 * Local coords: origin between the feet, y down. Teen standing height ≈ 690 units (before `scale`).
 * Limb angles: degrees from hanging straight down; positive swings toward screen-left.
 */

export type Mouth = 'closed' | 'smile' | 'o' | 'frown' | 'gasp' | 'talk' | 'grimace';
export type Arm = {shoulder: number; elbow: number};

export type CharacterProps = {
  who: CastMember;
  x?: number;
  y?: number;
  scale?: number;
  flip?: boolean;
  pose?: 'stand' | 'sit';
  walk?: number; // walk-cycle phase (radians); undefined = still
  lean?: number;
  headTilt?: number;
  headTurn?: number; // -1..1
  lookX?: number;
  lookY?: number;
  eyeOpen?: number; // 0..1.4
  brow?: number; // -1 angry .. 1 worried
  mouth?: Mouth;
  mouthOpen?: number;
  armL?: Arm;
  armR?: Arm;
  hold?: {side: 'L' | 'R'; item: React.ReactNode} | null;
  frame?: number;
  shiver?: number;
  dark?: number; // darken (in shadow / backlit)
  wet?: boolean; // rain drips
  opacity?: number;
};

const Limb: React.FC<{x: number; y: number; a1: number; a2: number; l1: number; l2: number; w1: number; w2: number; c1: string; c2: string; end: React.ReactNode}> = ({
  x,
  y,
  a1,
  a2,
  l1,
  l2,
  w1,
  w2,
  c1,
  c2,
  end,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${a1})`}>
    <line x1={0} y1={0} x2={0} y2={l1} stroke={c1} strokeWidth={w1} strokeLinecap="round" />
    <g transform={`translate(0 ${l1}) rotate(${a2})`}>
      <line x1={0} y1={0} x2={0} y2={l2} stroke={c2} strokeWidth={w2} strokeLinecap="round" />
      <g transform={`translate(0 ${l2})`}>{end}</g>
    </g>
  </g>
);

export const Character: React.FC<CharacterProps> = (p) => {
  const c = p.who;
  const pal = c.palette;
  const frame = p.frame ?? 0;
  const walking = p.walk !== undefined;
  const ph = p.walk ?? 0;
  const pose = p.pose ?? 'stand';
  const breath = Math.sin(frame * 0.12 + c.seed) * 0.012;
  const shiver = (p.shiver ?? 0) * Math.sin(frame * 2.3) * 2.2;
  const bob = walking ? -Math.abs(Math.sin(ph)) * 10 : 0;
  const swing = walking ? Math.sin(ph) * 21 : 0;
  const kneeA = walking ? Math.max(0, -Math.cos(ph)) * 36 : 0;
  const kneeB = walking ? Math.max(0, Math.cos(ph)) * 36 : 0;
  const armSwing = walking ? Math.sin(ph) * 20 : 0;
  const armL = p.armL ?? {shoulder: 6, elbow: -8};
  const armR = p.armR ?? {shoulder: -6, elbow: 8};
  const turn = p.headTurn ?? 0;
  const open = Math.max(0.05, p.eyeOpen ?? 1);
  const lookX = (p.lookX ?? 0) * 6;
  const lookY = (p.lookY ?? 0) * 5;
  const brow = p.brow ?? 0;
  const mouth = p.mouth ?? 'closed';
  const mo = p.mouthOpen ?? 0.5;
  const fx = turn * 18;

  const hipY = -260;
  const shoulderY = -450;
  const neckY = shoulderY - 30;
  const HS = c.headScale ?? 1;

  // ---------- face parts ----------
  const eye = (ex: number) => (
    <g>
      <ellipse cx={ex} cy={-88} rx={14} ry={17 * open} fill="#f4f1ea" />
      {open > 0.2 ? (
        <>
          <circle cx={ex + lookX} cy={-88 + lookY} r={8.5 * Math.min(1, 0.6 + open * 0.4)} fill={pal.eyes} />
          <circle cx={ex + lookX + 3} cy={-92 + lookY} r={2.6} fill="#fff" />
        </>
      ) : (
        <path d={`M ${ex - 13} -88 Q ${ex} -82 ${ex + 13} -88`} stroke="#2a1a1e" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      )}
      <path
        d={`M ${ex - 15} ${-116 + brow * 3} L ${ex + 13} ${-118 + brow * 3}`}
        transform={`rotate(${(ex - fx > 0 ? 1 : -1) * brow * 14} ${ex} -117)`}
        stroke={pal.brow ?? pal.hair}
        strokeWidth={6}
        strokeLinecap="round"
      />
    </g>
  );

  const mouthEl = () => {
    const mx = turn * 14;
    const my = -50;
    switch (mouth) {
      case 'smile':
        return <path d={`M ${mx - 16} ${my - 3} Q ${mx} ${my + 12} ${mx + 16} ${my - 3}`} stroke="#2a1a1e" strokeWidth={4} fill="none" strokeLinecap="round" />;
      case 'o':
        return <ellipse cx={mx} cy={my} rx={7} ry={9 + mo * 6} fill="#3a1418" />;
      case 'gasp':
        return <ellipse cx={mx} cy={my + 2} rx={11} ry={8 + mo * 14} fill="#3a1418" />;
      case 'talk':
        return <ellipse cx={mx} cy={my} rx={12} ry={2 + mo * 10} fill="#3a1418" />;
      case 'frown':
        return <path d={`M ${mx - 14} ${my + 4} Q ${mx} ${my - 6} ${mx + 14} ${my + 4}`} stroke="#2a1a1e" strokeWidth={4} fill="none" strokeLinecap="round" />;
      case 'grimace':
        return (
          <g>
            <rect x={mx - 18} y={my - 7} width={36} height={14} rx={6} fill="#f4f1ea" stroke="#2a1a1e" strokeWidth={3} />
            <line x1={mx - 18} y1={my} x2={mx + 18} y2={my} stroke="#2a1a1e" strokeWidth={2} />
          </g>
        );
      default:
        return <path d={`M ${mx - 11} ${my} Q ${mx} ${my + 5} ${mx + 11} ${my}`} stroke="#2a1a1e" strokeWidth={4} fill="none" strokeLinecap="round" />;
    }
  };

  // ---------- hair (back layer + front layer) ----------
  const sway = Math.sin(frame * 0.09 + c.seed) * 4 + (walking ? Math.sin(ph) * 8 : 0);
  const hairBack = () => {
    switch (c.hair) {
      case 'ponytail':
        return (
          <g>
            <ellipse cx={0} cy={-104} rx={84} ry={90} fill={pal.hair} />
            <g transform={`rotate(${sway} 70 -170)`}>
              <path d="M 60 -190 C 130 -200 150 -120 128 -40 C 120 -10 104 -10 110 -40 C 124 -110 110 -160 56 -160 Z" fill={pal.hair} />
              <circle cx={64} cy={-178} r={14} fill={pal.accent} />
            </g>
          </g>
        );
      case 'braids':
        return (
          <g>
            <ellipse cx={0} cy={-104} rx={86} ry={92} fill={pal.hair} />
            {[-70, -50, 50, 70].map((bx) => (
              <path key={bx} d={`M ${bx} -120 C ${bx * 1.15} -60 ${bx * 1.1} 0 ${bx} 40`} stroke={pal.hair} strokeWidth={18} strokeLinecap="round" fill="none" />
            ))}
          </g>
        );
      case 'curly':
        return (
          <g>
            {[...Array(11)].map((_, i) => {
              const a = (i / 11) * Math.PI * 2;
              return <circle key={i} cx={Math.cos(a) * 74} cy={-110 + Math.sin(a) * 74} r={34} fill={pal.hair} />;
            })}
          </g>
        );
      case 'bun':
        return (
          <g>
            <circle cx={-turn * 20} cy={-180} r={38} fill={pal.hair} />
            <ellipse cx={0} cy={-100} rx={80} ry={88} fill={pal.hair} />
          </g>
        );
      case 'short':
      case 'messy':
      default:
        return <ellipse cx={0} cy={-110} rx={82} ry={86} fill={pal.hair} />;
    }
  };

  const hairFront = () => {
    switch (c.hair) {
      case 'ponytail':
        return <path d={`M -82 -98 C -92 -190 -10 -212 30 -198 C 74 -186 92 -150 84 -110 C 50 -150 0 -150 ${-30 + turn * 10} -128 C -50 -118 -70 -110 -82 -98 Z`} fill={pal.hair} />;
      case 'messy':
        return (
          <path
            d={`M -84 -100 L -96 -150 L -66 -140 L -70 -190 L -30 -168 L -20 -214 L 12 -176 L 40 -210 L 52 -166 L 90 -180 L 78 -136 L 96 -118 L 70 -120 C 40 -136 ${10 + turn * 10} -130 -20 -134 C -50 -126 -70 -116 -84 -100 Z`}
            fill={pal.hair}
          />
        );
      case 'curly':
        return (
          <g>
            {[-60, -30, 0, 30, 60].map((cx, i) => (
              <circle key={cx} cx={cx + turn * 8} cy={-162 + (i % 2) * 10} r={30} fill={pal.hair} />
            ))}
          </g>
        );
      case 'braids':
        return <path d={`M -84 -104 C -88 -228 88 -232 84 -104 C 60 -150 ${turn * 10} -160 ${turn * 10} -160 C -20 -160 -60 -150 -84 -104 Z`} fill={pal.hair} />;
      case 'bun':
        return <path d={`M -78 -106 C -86 -200 84 -202 80 -104 C 60 -146 20 -156 ${4 + turn * 8} -150 C -20 -150 -56 -140 -78 -106 Z`} fill={pal.hair} />;
      case 'short':
      default:
        return <path d={`M -82 -104 C -90 -228 88 -232 84 -104 C 60 -140 -40 -150 -82 -104 Z`} fill={pal.hair} />;
    }
  };

  const head = (
    <g transform={`translate(0 ${neckY}) rotate(${(p.headTilt ?? 0) + shiver * 0.6}) scale(${HS})`}>
      {hairBack()}
      <rect x={-17} y={-30} width={34} height={44} fill={pal.skinShade} />
      <ellipse cx={-70 + fx * 0.4} cy={-84} rx={12} ry={17} fill={pal.skinShade} />
      <ellipse cx={70 + fx * 0.4} cy={-84} rx={12} ry={17} fill={pal.skinShade} />
      <ellipse cx={turn * 6} cy={-95} rx={74} ry={84} fill={pal.skin} />
      {c.freckles
        ? [-50, -40, -46, 40, 50, 44].map((dx, i) => <circle key={i} cx={fx + dx} cy={-66 + (i % 3) * 6} r={2.4} fill={pal.skinShade} opacity={0.9} />)
        : null}
      <ellipse cx={fx - 44} cy={-60} rx={13} ry={7} fill="#e58f8a" opacity={0.35} />
      <ellipse cx={fx + 44} cy={-60} rx={13} ry={7} fill="#e58f8a" opacity={0.35} />
      {eye(fx - 27)}
      {eye(fx + 27)}
      {c.glasses ? (
        <g stroke="#1c1a22" strokeWidth={5} fill="#cfe6ff" fillOpacity={0.12}>
          <circle cx={fx - 27} cy={-88} r={24} />
          <circle cx={fx + 27} cy={-88} r={24} />
          <line x1={fx - 3} y1={-90} x2={fx + 3} y2={-90} />
        </g>
      ) : null}
      <path d={`M ${fx + 2} -76 Q ${fx + 7} -66 ${fx} -64`} stroke={pal.skinShade} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      {mouthEl()}
      {hairFront()}
      {c.headphones ? (
        <g>
          <path d="M -86 -40 C -100 30 100 30 86 -40" stroke="#22222e" strokeWidth={10} fill="none" transform="translate(0 70)" />
          <rect x={-104} y={10} width={30} height={40} rx={10} fill="#22222e" />
          <rect x={74} y={10} width={30} height={40} rx={10} fill="#22222e" />
        </g>
      ) : null}
    </g>
  );

  // ---------- outfits ----------
  const torso = () => {
    const sy = shoulderY;
    const body = `M -68 ${sy + 4} Q 0 ${sy - 18} 68 ${sy + 4} L 78 ${hipY + 14} Q 0 ${hipY + 30} -78 ${hipY + 14} Z`;
    switch (c.top) {
      case 'raincoat':
        return (
          <g>
            <path d={`M -58 ${sy - 4} Q 0 ${sy - 44} 58 ${sy - 4} Q 0 ${sy + 24} -58 ${sy - 4} Z`} fill={pal.topShade} />
            <path d={`M -70 ${sy + 4} Q 0 ${sy - 18} 70 ${sy + 4} L 92 ${hipY + 70} Q 0 ${hipY + 88} -92 ${hipY + 70} Z`} fill={pal.top} />
            <line x1={0} y1={sy - 6} x2={0} y2={hipY + 80} stroke={pal.topShade} strokeWidth={5} />
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={14} cy={sy + 40 + i * 62} r={7} fill={pal.topShade} />
            ))}
            <path d={`M -60 ${hipY - 30} L -24 ${hipY - 30}`} stroke={pal.topShade} strokeWidth={6} strokeLinecap="round" />
            <path d={`M 30 ${hipY - 30} L 64 ${hipY - 30}`} stroke={pal.topShade} strokeWidth={6} strokeLinecap="round" />
          </g>
        );
      case 'bomber':
        return (
          <g>
            <path d={body} fill={pal.top} />
            <path d={`M -30 ${sy - 8} L 0 ${sy + 60} L 30 ${sy - 8} Z`} fill={pal.inner ?? '#ddd'} />
            <path d={`M -36 ${sy - 10} Q 0 ${sy + 10} 36 ${sy - 10}`} stroke={pal.accent} strokeWidth={14} fill="none" strokeLinecap="round" />
            <rect x={-78} y={hipY - 4} width={156} height={22} rx={10} fill={pal.topShade} />
            <line x1={0} y1={sy + 60} x2={0} y2={hipY} stroke={pal.topShade} strokeWidth={5} />
          </g>
        );
      case 'sweater':
        return (
          <g>
            <path d={body} fill={pal.top} />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={-76} y={sy + 30 + i * 48} width={152} height={18} fill={pal.accent} opacity={0.9} />
            ))}
            <path d={`M -26 ${sy - 6} Q 0 ${sy + 18} 26 ${sy - 6}`} stroke={pal.topShade} strokeWidth={10} fill="none" />
          </g>
        );
      case 'uniform':
        return (
          <g>
            <path d={body} fill={pal.top} />
            <path d={`M -24 ${sy - 6} L 0 ${sy + 40} L 24 ${sy - 6}`} fill={pal.inner ?? '#ddd'} />
            <path d={`M -40 ${sy + 70} l 10 -12 l 10 12 l -10 14 z`} fill={pal.accent} />
            <rect x={-78} y={hipY - 4} width={156} height={18} fill="#1e1a14" />
          </g>
        );
      case 'hoodie':
      default:
        return (
          <g>
            <path d={`M -54 ${sy - 6} Q 0 ${sy - 40} 54 ${sy - 6} Q 0 ${sy + 22} -54 ${sy - 6} Z`} fill={pal.topShade} />
            <path d={body} fill={pal.top} />
            <path d={`M -40 ${hipY - 50} L 40 ${hipY - 50} L 48 ${hipY + 5} L -48 ${hipY + 5} Z`} fill={pal.topShade} opacity={0.7} />
            <line x1={-12} y1={sy + 6} x2={-14} y2={sy + 60} stroke="#e8e6dc" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
            <line x1={12} y1={sy + 6} x2={14} y2={sy + 60} stroke="#e8e6dc" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
          </g>
        );
    }
  };

  const shoe = <ellipse cx={0} cy={4} rx={26} ry={13} fill={pal.shoes} />;
  const handEl = (side: 'L' | 'R') => (
    <g>
      {p.hold?.side === side ? <g>{p.hold.item}</g> : null}
      <circle r={17} fill={pal.skin} />
    </g>
  );
  const sleeve = pal.top;
  const sleeveShade = pal.topShade;

  const drips =
    p.wet && frame
      ? [...Array(5)].map((_, i) => {
          const t = ((frame * 2.5 + i * 37) % 120) / 120;
          return <ellipse key={i} cx={-60 + i * 30} cy={-560 + t * 340} rx={3} ry={7} fill="#bfe0ff" opacity={0.6 * (1 - t)} />;
        })
      : null;

  return (
    <g
      transform={`translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.flip ? -1 : 1) * (p.scale ?? 1) * c.size} ${(p.scale ?? 1) * c.size})`}
      opacity={p.opacity ?? 1}
      style={p.dark ? {filter: `brightness(${1 - p.dark}) saturate(${1 - p.dark * 0.5})`} : undefined}
    >
      {pose === 'stand' ? <ellipse cx={0} cy={6} rx={90} ry={16} fill="#000" opacity={0.35} /> : null}
      <g transform={`translate(${shiver} ${bob}) rotate(${p.lean ?? 0} 0 ${hipY})`}>
        {pose === 'stand' ? (
          <g>
            <Limb x={-24} y={hipY} a1={swing} a2={-kneeA} l1={132} l2={124} w1={44} w2={38} c1={pal.pants} c2={pal.pants} end={shoe} />
            <Limb x={24} y={hipY} a1={-swing} a2={-kneeB} l1={132} l2={124} w1={44} w2={38} c1={pal.pants} c2={pal.pants} end={shoe} />
          </g>
        ) : null}
        <g transform={`translate(0 ${hipY}) scale(1 ${1 + breath}) translate(0 ${-hipY})`}>
          <Limb x={-60} y={shoulderY + 14} a1={armL.shoulder + armSwing} a2={armL.elbow} l1={110} l2={100} w1={36} w2={32} c1={sleeveShade} c2={sleeve} end={handEl('L')} />
          {torso()}
          {head}
          <Limb x={60} y={shoulderY + 14} a1={armR.shoulder - armSwing} a2={armR.elbow} l1={110} l2={100} w1={36} w2={32} c1={sleeveShade} c2={sleeve} end={handEl('R')} />
          {drips}
        </g>
      </g>
    </g>
  );
};

/** Small phone a character can hold (pass as `hold.item`) */
export const HandPhone: React.FC<{glow?: number; color?: string}> = ({glow = 1, color = '#7fd4ff'}) => (
  <g transform="translate(0 6)">
    <rect x={-17} y={-30} width={34} height={60} rx={7} fill="#0d0f18" stroke="#3a3f55" strokeWidth={2} />
    <rect x={-13} y={-25} width={26} height={50} rx={4} fill={color} opacity={0.3 + 0.7 * glow} />
  </g>
);
