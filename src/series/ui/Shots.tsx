import React from 'react';
import {Camera, Stage} from '../../components/Camera';
import {Attic, AtticProps} from '../locations/Attic';
import {SeriesDefs} from './Glow';
import {Timeline} from './SeriesUI';

/** Reusable attic camera shot (Ch.2+). Children are drawn in attic world coordinates. */
export const AtticShot: React.FC<
  Omit<AtticProps, 'frame'> & {g: number; cam: {x: number; y: number; zoom: number; rotate?: number}; children?: React.ReactNode; overlay?: React.ReactNode}
> = ({g, cam, children, overlay, ...room}) => (
  <Stage bg="#06060c">
    <SeriesDefs />
    <Camera x={cam.x} y={cam.y} zoom={cam.zoom} rotate={cam.rotate ?? 0}>
      <Attic frame={g} {...room} />
      {overlay}
      {children}
    </Camera>
  </Stage>
);

/** Lip-sync helper bound to a chapter timeline: mouth openness 0..1 for line `id` at global frame g */
export const makeSpeak = (tl: Timeline) => (g: number, id: string) => {
  const line = tl.lines.find((l) => l.id === id);
  const w = line?.words.find((wd) => g >= wd.start && g < wd.end - 1);
  return w ? 0.25 + 0.75 * Math.abs(Math.sin((g - w.start) * 0.85)) : 0;
};

/** Phone flashlight: a cone of cold light from (x1,y1) toward (x2,y2) */
export const Flashlight: React.FC<{x1: number; y1: number; x2: number; y2: number; spread?: number; opacity?: number}> = ({x1, y1, x2, y2, spread = 0.32, opacity = 1}) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1) * 1.6;
  const p1 = [x1 + Math.cos(a - spread) * len, y1 + Math.sin(a - spread) * len];
  const p2 = [x1 + Math.cos(a + spread) * len, y1 + Math.sin(a + spread) * len];
  const id = `fl${Math.round(x1)}${Math.round(y1)}`;
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={opacity}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x1 + Math.cos(a) * len} y2={y1 + Math.sin(a) * len}>
          <stop offset="0" stopColor="#eaf4ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#eaf4ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M ${x1} ${y1} L ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} Z`} fill={`url(#${id})`} />
      <circle cx={x2} cy={y2} r={170} fill="url(#gWhite)" opacity={0.45} />
      <circle cx={x1} cy={y1} r={26} fill="#fff" opacity={0.9} />
    </g>
  );
};
