import React from 'react';
import {T} from '../theme';

/** Gradient definitions shared by every series scene. Put <SeriesDefs/> once inside each <svg>. */
export const SeriesDefs: React.FC = () => (
  <defs>
    {(
      [
        ['gPhone', T.phone],
        ['gWarm', T.warm],
        ['gRed', T.signalRed],
        ['gWhite', T.signalWhite],
        ['gAmber', T.amber],
      ] as const
    ).map(([id, c]) => (
      <radialGradient key={id} id={id}>
        <stop offset="0" stopColor={c} stopOpacity="0.85" />
        <stop offset="0.4" stopColor={c} stopOpacity="0.3" />
        <stop offset="1" stopColor={c} stopOpacity="0" />
      </radialGradient>
    ))}
  </defs>
);

export type GlowColor = 'phone' | 'warm' | 'red' | 'white' | 'amber';
const IDS: Record<GlowColor, string> = {phone: 'gPhone', warm: 'gWarm', red: 'gRed', white: 'gWhite', amber: 'gAmber'};

/** Additive light blob (screen blend) */
export const Glow: React.FC<{x: number; y: number; r: number; color?: GlowColor; opacity?: number}> = ({x, y, r, color = 'phone', opacity = 1}) =>
  opacity > 0.001 ? <circle cx={x} cy={y} r={r} fill={`url(#${IDS[color]})`} opacity={opacity} style={{mixBlendMode: 'screen'}} /> : null;
