import React from 'react';
import {AbsoluteFill} from 'remotion';
import {HEIGHT, WIDTH} from '../lib/constants';

export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.85, color = '0,0,0'}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 70% 55% at 50% 48%, rgba(${color},0) 40%, rgba(${color},${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/** Animated film grain (rendered at half resolution, scaled up — cheap to render). */
export const Grain: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = 0.08}) => (
  <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
    <svg viewBox={`0 0 ${WIDTH / 3} ${HEIGHT / 3}`} width={WIDTH} height={HEIGHT} preserveAspectRatio="none">
      <filter id={`grain${frame % 6}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={frame % 6} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain${frame % 6})`} />
    </svg>
  </AbsoluteFill>
);

export const Flash: React.FC<{opacity: number; color?: string}> = ({opacity, color = '#fff'}) =>
  opacity > 0.001 ? <AbsoluteFill style={{background: color, opacity, pointerEvents: 'none'}} /> : null;

/** Colored light wash over the whole frame (e.g. red danger pulse) */
export const Wash: React.FC<{opacity: number; color: string; blend?: React.CSSProperties['mixBlendMode']}> = ({opacity, color, blend = 'soft-light'}) =>
  opacity > 0.001 ? <AbsoluteFill style={{background: color, opacity, mixBlendMode: blend, pointerEvents: 'none'}} /> : null;
