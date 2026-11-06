import React from 'react';
import {HEIGHT, WIDTH} from '../lib/constants';

/** Frames a point of the world in the center of the 1080x1920 screen. */
export const Camera: React.FC<{
  x: number;
  y: number;
  zoom?: number;
  rotate?: number;
  children: React.ReactNode;
}> = ({x, y, zoom = 1, rotate = 0, children}) => (
  <g transform={`translate(${WIDTH / 2} ${HEIGHT / 2}) rotate(${rotate}) scale(${zoom}) translate(${-x} ${-y})`}>{children}</g>
);

/** Full-frame SVG stage */
export const Stage: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = '#05070d'}) => (
  <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, background: bg}}>
    {children}
  </svg>
);
