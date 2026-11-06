import React from 'react';
import {COLORS} from '../lib/constants';

/**
 * One shared, fully-rigged 2D character.
 * Maya, Mom, the silhouette and "the double" are all this same rig with different looks,
 * which keeps proportions and style consistent across every scene.
 *
 * Local coordinates: origin = between the feet, y grows downwards, standing height ≈ 690 units.
 * Limb angles are in degrees from "hanging straight down"; positive swings toward screen-left.
 */

export type Look = 'maya' | 'mom' | 'double' | 'silhouette';
export type Mouth = 'closed' | 'o' | 'frown' | 'grin' | 'gasp' | 'talk';

export type Arm = {shoulder: number; elbow: number};

export type PersonProps = {
  look: Look;
  x?: number;
  y?: number;
  scale?: number;
  flip?: boolean; // mirror horizontally (face the other way)
  pose?: 'stand' | 'sit';
  walk?: number; // walk-cycle phase in radians (undefined = standing still)
  lean?: number; // torso lean (deg)
  headTilt?: number;
  headTurn?: number; // -1 .. 1 (3/4 views)
  lookX?: number; // -1 .. 1
  lookY?: number; // -1 .. 1
  eyeOpen?: number; // 0 closed .. 1 normal .. 1.4 terrified
  brow?: number; // -1 angry .. 0 neutral .. 1 worried
  mouth?: Mouth;
  mouthOpen?: number; // 0..1, used by 'talk' / 'gasp'
  armL?: Arm; // screen-left arm
  armR?: Arm; // screen-right arm
  holdPhone?: 'L' | 'R' | null;
  phoneGlow?: number;
  breathe?: number; // frame, drives subtle breathing
  shiver?: number; // 0..1 fear tremble
  frame?: number;
  opacity?: number;
  dark?: number; // 0..1 darken the whole figure (backlit / in shadow)
};

type Palette = {
  skin: string;
  skinShade: string;
  hair: string;
  top: string;
  topShade: string;
  pants: string;
  shoes: string;
  eyeWhite: string;
  pupil: string;
  line: string;
  blush: string;
};

const PALETTES: Record<Look, Palette> = {
  maya: {
    skin: COLORS.skin,
    skinShade: COLORS.skinShade,
    hair: COLORS.hair,
    top: COLORS.hoodie,
    topShade: COLORS.hoodieShade,
    pants: COLORS.pants,
    shoes: '#d9dbe6',
    eyeWhite: '#f4f1ea',
    pupil: '#1a1420',
    line: '#2a1a1e',
    blush: '#e58f8a',
  },
  double: {
    skin: '#b8c5cf',
    skinShade: '#93a3b0',
    hair: '#14111c',
    top: '#3c5c5a',
    topShade: '#2d4746',
    pants: '#232838',
    shoes: '#8e94a6',
    eyeWhite: '#0b0a10',
    pupil: '#f2f6ff',
    line: '#0e0b12',
    blush: 'transparent',
  },
  mom: {
    skin: COLORS.momSkin,
    skinShade: '#c08f6c',
    hair: COLORS.momHair,
    top: COLORS.robe,
    topShade: COLORS.robeShade,
    pants: '#5b6487',
    shoes: '#e9d7c4',
    eyeWhite: '#f4f1ea',
    pupil: '#1a1420',
    line: '#2a1a1e',
    blush: '#d98479',
  },
  silhouette: {
    skin: '#06070d',
    skinShade: '#06070d',
    hair: '#06070d',
    top: '#06070d',
    topShade: '#06070d',
    pants: '#06070d',
    shoes: '#06070d',
    eyeWhite: 'transparent',
    pupil: 'transparent',
    line: 'transparent',
    blush: 'transparent',
  },
};

const Limb: React.FC<{
  x: number;
  y: number;
  a1: number;
  a2: number;
  l1: number;
  l2: number;
  w1: number;
  w2: number;
  color: string;
  shade: string;
  end: React.ReactNode;
}> = ({x, y, a1, a2, l1, l2, w1, w2, color, shade, end}) => (
  <g transform={`translate(${x} ${y}) rotate(${a1})`}>
    <line x1={0} y1={0} x2={0} y2={l1} stroke={shade} strokeWidth={w1} strokeLinecap="round" />
    <g transform={`translate(0 ${l1}) rotate(${a2})`}>
      <line x1={0} y1={0} x2={0} y2={l2} stroke={color} strokeWidth={w2} strokeLinecap="round" />
      <g transform={`translate(0 ${l2})`}>{end}</g>
    </g>
  </g>
);

export const MiniPhone: React.FC<{glow?: number}> = ({glow = 1}) => (
  <g>
    <rect x={-17} y={-30} width={34} height={60} rx={7} fill="#0d0f18" stroke="#3a3f55" strokeWidth={2} />
    <rect x={-13} y={-25} width={26} height={50} rx={4} fill={COLORS.phone} opacity={0.35 + 0.65 * glow} />
  </g>
);

export const Person: React.FC<PersonProps> = (p) => {
  const pal = PALETTES[p.look];
  const isMom = p.look === 'mom';
  const isDouble = p.look === 'double';
  const frame = p.frame ?? 0;
  const pose = p.pose ?? 'stand';
  const walking = p.walk !== undefined;
  const ph = p.walk ?? 0;

  const breath = Math.sin((p.breathe ?? frame) * 0.12) * 0.012;
  const shiver = (p.shiver ?? 0) * Math.sin(frame * 2.3) * 2.2;
  const bob = walking ? -Math.abs(Math.sin(ph)) * 10 : 0;

  // legs
  const swing = walking ? Math.sin(ph) * 21 : 0;
  const kneeA = walking ? Math.max(0, -Math.cos(ph)) * 38 : 0;
  const kneeB = walking ? Math.max(0, Math.cos(ph)) * 38 : 0;

  // arms (walk swing adds on top of given pose)
  const armSwing = walking ? Math.sin(ph) * 22 : 0;
  const armL = p.armL ?? {shoulder: 6, elbow: -8};
  const armR = p.armR ?? {shoulder: -6, elbow: 8};

  const turn = p.headTurn ?? 0;
  const open = Math.max(0.05, p.eyeOpen ?? 1);
  const lookX = (p.lookX ?? 0) * 6;
  const lookY = (p.lookY ?? 0) * 5;
  const brow = p.brow ?? 0;
  const mouth = p.mouth ?? 'closed';
  const mo = p.mouthOpen ?? 0.5;

  const hipY = -260;
  const shoulderY = isMom ? -470 : -450;
  const neckY = shoulderY - 30;
  const headR = isMom ? {rx: 70, ry: 82} : {rx: 74, ry: 84};

  const hand = (side: 'L' | 'R') => (
    <g>
      {p.holdPhone === side ? (
        <g transform="translate(0 6)">
          <MiniPhone glow={p.phoneGlow ?? 1} />
        </g>
      ) : null}
      <circle r={17} fill={pal.skin} />
    </g>
  );

  const shoe = <ellipse cx={0} cy={4} rx={26} ry={13} fill={pal.shoes} />;

  const fx = turn * 18; // face feature shift for 3/4 turns

  const eye = (ex: number) => (
    <g>
      <ellipse cx={ex} cy={-88} rx={isDouble ? 17 : 14} ry={(isDouble ? 20 : 17) * open} fill={pal.eyeWhite} />
      {open > 0.2 ? (
        <>
          <circle cx={ex + lookX} cy={-88 + lookY} r={isDouble ? 3.5 : 8.5 * Math.min(1, 0.6 + open * 0.4)} fill={pal.pupil} />
          {!isDouble ? <circle cx={ex + lookX + 3} cy={-92 + lookY} r={2.6} fill="#fff" /> : null}
        </>
      ) : (
        <path d={`M ${ex - 13} -88 Q ${ex} -82 ${ex + 13} -88`} stroke={pal.line} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      )}
      {/* brow */}
      <path
        d={`M ${ex - 15 * Math.sign(ex - fx || 1)} ${-115 + brow * 3} L ${ex + 13 * Math.sign(ex - fx || 1)} ${-117 + brow * 3}`}
        transform={`rotate(${(ex - fx > 0 ? 1 : -1) * brow * 14} ${ex} -116)`}
        stroke={isMom ? '#4a2f24' : pal.hair}
        strokeWidth={6}
        strokeLinecap="round"
      />
    </g>
  );

  const mouthShape = () => {
    const mx = turn * 14;
    const my = -50;
    switch (mouth) {
      case 'o':
        return <ellipse cx={mx} cy={my} rx={7} ry={9 + mo * 6} fill="#3a1418" />;
      case 'gasp':
        return <ellipse cx={mx} cy={my + 2} rx={11} ry={8 + mo * 14} fill="#3a1418" />;
      case 'talk':
        return <ellipse cx={mx} cy={my} rx={12} ry={2 + mo * 10} fill="#3a1418" />;
      case 'frown':
        return <path d={`M ${mx - 14} ${my + 4} Q ${mx} ${my - 6} ${mx + 14} ${my + 4}`} stroke={pal.line} strokeWidth={4} fill="none" strokeLinecap="round" />;
      case 'grin':
        return (
          <g>
            <path d={`M ${mx - 34} ${my - 6} Q ${mx} ${my + 30} ${mx + 34} ${my - 6} Q ${mx} ${my + 8} ${mx - 34} ${my - 6} Z`} fill="#140a0e" />
            <path d={`M ${mx - 28} ${my - 3} Q ${mx} ${my + 12} ${mx + 28} ${my - 3}`} stroke="#e8e6dc" strokeWidth={4} fill="none" />
          </g>
        );
      default:
        return <path d={`M ${mx - 11} ${my} Q ${mx} ${my + 5} ${mx + 11} ${my}`} stroke={pal.line} strokeWidth={4} fill="none" strokeLinecap="round" />;
    }
  };

  const head = (
    <g transform={`translate(0 ${neckY}) rotate(${(p.headTilt ?? 0) + shiver * 0.6})`}>
      {/* back hair */}
      {isMom ? (
        <>
          <circle cx={-turn * 20} cy={-178} r={40} fill={pal.hair} />
          <ellipse cx={0} cy={-100} rx={headR.rx + 10} ry={headR.ry + 6} fill={pal.hair} />
        </>
      ) : (
        <path
          d={`M ${-92} -95 C ${-100} -170 ${-50} -198 0 -198 C 50 -198 100 -170 92 -95 L 96 -22 C 70 -10 50 -14 40 -28 L -40 -28 C -50 -14 -70 -10 -96 -22 Z`}
          fill={pal.hair}
        />
      )}
      {/* neck */}
      <rect x={-17} y={-30} width={34} height={44} fill={pal.skinShade} />
      {/* ears */}
      <ellipse cx={-headR.rx + 4 + fx * 0.4} cy={-84} rx={12} ry={17} fill={pal.skinShade} />
      <ellipse cx={headR.rx - 4 + fx * 0.4} cy={-84} rx={12} ry={17} fill={pal.skinShade} />
      {/* face */}
      <ellipse cx={turn * 6} cy={-95} rx={headR.rx} ry={headR.ry} fill={pal.skin} />
      {/* blush */}
      <ellipse cx={fx - 44} cy={-62} rx={13} ry={7} fill={pal.blush} opacity={0.45} />
      <ellipse cx={fx + 44} cy={-62} rx={13} ry={7} fill={pal.blush} opacity={0.45} />
      {eye(fx - 27)}
      {eye(fx + 27)}
      {/* nose */}
      <path d={`M ${fx + 2} -76 Q ${fx + 7} -66 ${fx} -64`} stroke={pal.skinShade} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      {mouthShape()}
      {/* front hair / fringe */}
      {isMom ? (
        <path d={`M -78 -106 C -86 -200 84 -202 80 -104 C 60 -146 20 -156 ${4 + turn * 8} -150 C -20 -150 -56 -140 -78 -106 Z`} fill={pal.hair} />
      ) : (
        <>
          <path
            d={`M -84 -104 C -90 -190 -30 -206 10 -201 C 60 -196 94 -170 86 -112 C 60 -134 34 -140 ${12 + turn * 10} -126 C -6 -148 -46 -140 -84 -104 Z`}
            fill={pal.hair}
          />
          <path d="M -84 -110 C -96 -70 -92 -40 -80 -28 L -70 -30 C -78 -60 -76 -90 -72 -110 Z" fill={pal.hair} />
          <path d="M 84 -110 C 96 -70 92 -40 80 -28 L 70 -30 C 78 -60 76 -90 72 -110 Z" fill={pal.hair} />
          {isDouble ? <path d="M 20 -186 C 40 -170 58 -150 66 -118" stroke="#c9ced8" strokeWidth={9} fill="none" strokeLinecap="round" /> : null}
        </>
      )}
    </g>
  );

  const torso = isMom ? (
    <g>
      <path d={`M -70 ${shoulderY} Q 0 ${shoulderY - 20} 70 ${shoulderY} L 92 -150 Q 0 -134 -92 -150 Z`} fill={pal.top} />
      <path d={`M -10 ${shoulderY - 6} L 30 -150 L 50 -152 L 18 ${shoulderY - 8} Z`} fill={pal.topShade} />
      <rect x={-80} y={-300} width={160} height={18} rx={9} fill={pal.topShade} />
    </g>
  ) : (
    <g>
      {/* hood */}
      <path d={`M -54 ${shoulderY - 6} Q 0 ${shoulderY - 40} 54 ${shoulderY - 6} Q 0 ${shoulderY + 22} -54 ${shoulderY - 6} Z`} fill={pal.topShade} />
      <path d={`M -68 ${shoulderY + 4} Q 0 ${shoulderY - 18} 68 ${shoulderY + 4} L 76 ${hipY + 10} Q 0 ${hipY + 26} -76 ${hipY + 10} Z`} fill={pal.top} />
      {/* pocket + strings */}
      <path d={`M -40 ${hipY - 50} L 40 ${hipY - 50} L 48 ${hipY + 5} L -48 ${hipY + 5} Z`} fill={pal.topShade} opacity={0.7} />
      <line x1={-12} y1={shoulderY + 6} x2={-14} y2={shoulderY + 60} stroke="#e8e6dc" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      <line x1={12} y1={shoulderY + 6} x2={14} y2={shoulderY + 60} stroke="#e8e6dc" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
    </g>
  );

  const legs =
    pose === 'stand' ? (
      <g>
        <Limb x={-24} y={hipY} a1={swing} a2={-kneeA} l1={132} l2={124} w1={44} w2={38} color={pal.pants} shade={pal.pants} end={shoe} />
        <Limb x={24} y={hipY} a1={-swing} a2={-kneeB} l1={132} l2={124} w1={44} w2={38} color={pal.pants} shade={pal.pants} end={shoe} />
      </g>
    ) : null;

  const armColor = pal.top;
  const armShade = pal.topShade;

  return (
    <g
      transform={`translate(${p.x ?? 0} ${p.y ?? 0}) scale(${(p.flip ? -1 : 1) * (p.scale ?? 1)} ${p.scale ?? 1})`}
      opacity={p.opacity ?? 1}
      style={p.dark ? {filter: `brightness(${1 - p.dark}) saturate(${1 - p.dark * 0.5})`} : undefined}
    >
      {/* soft contact shadow */}
      {pose === 'stand' && p.look !== 'silhouette' ? <ellipse cx={0} cy={6} rx={90} ry={16} fill="#000" opacity={0.35} /> : null}
      <g transform={`translate(${shiver} ${bob}) rotate(${p.lean ?? 0} 0 ${hipY})`}>
        {legs}
        {isMom && pose === 'stand' ? (
          <path d={`M -88 -160 Q 0 -150 88 -160 L 96 -82 Q 0 -70 -96 -82 Z`} fill={pal.top} />
        ) : null}
        <g transform={`translate(0 ${hipY}) scale(1 ${1 + breath}) translate(0 ${-hipY})`}>
          {/* back arm first for depth */}
          <Limb
            x={-60}
            y={shoulderY + 14}
            a1={armL.shoulder + armSwing}
            a2={armL.elbow}
            l1={110}
            l2={100}
            w1={36}
            w2={32}
            color={armColor}
            shade={armShade}
            end={hand('L')}
          />
          {torso}
          {head}
          <Limb
            x={60}
            y={shoulderY + 14}
            a1={armR.shoulder - armSwing}
            a2={armR.elbow}
            l1={110}
            l2={100}
            w1={36}
            w2={32}
            color={armColor}
            shade={armShade}
            end={hand('R')}
          />
        </g>
      </g>
    </g>
  );
};
