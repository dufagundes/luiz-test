import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Camera, Stage} from '../components/Camera';
import {Defs, OutsideView, Room, WINDOW} from '../components/Room';
import {Person} from '../characters/Person';
import {Vignette} from '../components/Effects';
import {easeInOut, easeOut, tween, wobble} from '../lib/anim';
import {Dust, Light} from './common';

/** The figure in the driveway that looks exactly like Mom (drawn in OutsideView coordinates) */
export const DrivewayMom: React.FC<{frame: number; wave?: boolean}> = ({frame, wave = true}) => (
  <g>
    {/* street-light pool lighting her from above */}
    <ellipse cx={250} cy={585} rx={60} ry={10} fill="#ffd894" opacity={0.25} />
    <path d="M 250 380 L 205 590 L 295 590 Z" fill="#ffd894" opacity={0.08} />
    <Person
      look="mom"
      x={250}
      y={585}
      scale={0.17}
      frame={frame}
      headTilt={-6}
      lookY={-0.8}
      armR={wave ? {shoulder: -150 + Math.sin(frame * 0.18) * 22, elbow: -15} : undefined}
      mouth="closed"
      dark={0.35}
    />
    {/* faint eye glints */}
    <circle cx={245} cy={585 - 0.17 * 588} r={1.3} fill="#fff" opacity={0.8} />
    <circle cx={255} cy={585 - 0.17 * 588} r={1.3} fill="#fff" opacity={0.8} />
  </g>
);

/** SCENE 4 (13.1–17.1s) — Maya runs to the window. Mom is outside in the driveway… waving. */
export const S4Window: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + 393;

  if (f < 55) {
    const mx = tween(f, [0, 50], [1350, 2050], easeOut);
    const running = f < 46;
    const phase = f * 0.5;
    return (
      <AbsoluteFill>
        <Stage>
          <Defs />
          <Camera x={tween(f, [0, 55], [1500, 2060], easeInOut)} y={tween(f, [0, 55], [1260, 1180])} zoom={tween(f, [0, 55], [0.95, 1.12])}>
            <Room frame={g} showPhone={false} />
            <Person
              look="maya"
              x={mx}
              y={1760}
              scale={1.08}
              frame={g}
              walk={running ? phase : undefined}
              lean={running ? 8 : tween(f, [46, 55], [8, -3])}
              headTurn={0.75}
              lookX={1}
              lookY={-0.3}
              eyeOpen={1.25}
              brow={1}
              mouth="frown"
              armL={running ? {shoulder: -10, elbow: -60} : {shoulder: -10, elbow: -30}}
              armR={running ? {shoulder: 10, elbow: -60} : {shoulder: 20, elbow: 130}}
              holdPhone="R"
            />
            <Light x={WINDOW.x + 180} y={WINDOW.y + 300} r={700} color="moon" opacity={0.35} />
            <Dust frame={g} x={1500} y={700} w={900} h={900} />
          </Camera>
        </Stage>
        <Vignette strength={0.85} />
      </AbsoluteFill>
    );
  }

  // POV through the window: slow push-in on the figure in the driveway
  const s = f - 55;
  const scale = tween(s, [0, 65], [4.6, 6.0], easeInOut);
  // keep the driveway figure (250, 520 in OutsideView coords) near screen center
  const ox = 540 - 250 * scale + wobble(f, 3) * 6;
  const oy = 900 - 530 * scale + wobble(f, 5) * 6;
  return (
    <AbsoluteFill>
      <Stage bg="#03040a">
        <Defs />
        <OutsideView frame={g} ox={ox} oy={oy} s={scale}>
          <DrivewayMom frame={g} />
        </OutsideView>
        {/* window frame (muntins) in the foreground, out of focus */}
        <g opacity={0.95} style={{filter: 'blur(6px)'}}>
          <rect x={tween(s, [0, 65], [200, 120])} y={-50} width={60} height={2100} fill="#121626" />
          <rect x={-50} y={tween(s, [0, 65], [230, 170])} width={1200} height={60} fill="#121626" />
        </g>
        {/* glass reflection of Maya, faint */}
        <g opacity={0.06}>
          <Person look="maya" x={900} y={2500} scale={2.2} frame={g} headTurn={0.5} eyeOpen={1.3} brow={1} mouth="frown" />
        </g>
      </Stage>
      <Vignette strength={0.95} />
    </AbsoluteFill>
  );
};
