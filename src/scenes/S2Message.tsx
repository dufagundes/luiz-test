import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Camera, Stage} from '../components/Camera';
import {Blanket, Defs, Room} from '../components/Room';
import {BigPhone, Bubble} from '../components/Phone';
import {Person} from '../characters/Person';
import {Vignette} from '../components/Effects';
import {blink, easeInOut, easeOut, tween, wobble} from '../lib/anim';
import {Dust, Light} from './common';

// Maya sitting up in bed against the pillow (world coords)
export const MAYA_BED = {x: 1500, y: 1520, scale: 1};

export const CHAT_1: Bubble[] = [
  {text: "Don't open the door.", at: 171},
  {text: "It's not Mom.", at: 204, danger: true},
];

/** SCENE 2 (3.5–7.6s) — Maya reads the message. Push-in on her face, then the chat itself. */
export const S2Message: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + 105; // global frame

  if (f < 62) {
    const camX = tween(f, [0, 62], [1380, 1490], easeInOut);
    const camY = tween(f, [0, 62], [1090, 960], easeInOut);
    const zoom = tween(f, [0, 62], [1.05, 2.1], easeInOut);
    const widen = tween(f, [22, 34], [1, 1.38], easeOut);
    return (
      <AbsoluteFill>
        <Stage>
          <Defs />
          <Camera x={camX + wobble(f, 1) * 4} y={camY + wobble(f, 2) * 4} zoom={zoom}>
            <Room frame={g} showPhone={false} />
            <Person
              look="maya"
              {...MAYA_BED}
              pose="sit"
              frame={g}
              headTurn={-0.35}
              headTilt={tween(f, [0, 30], [6, -2])}
              lookX={-0.2}
              lookY={0.9}
              eyeOpen={widen * blink(f, 40)}
              brow={tween(f, [20, 34], [0.2, 1])}
              mouth={f > 30 ? 'o' : 'closed'}
              mouthOpen={0.3}
              armL={{shoulder: -40, elbow: -110}}
              armR={{shoulder: 30, elbow: 115}}
              holdPhone="R"
              lean={-6}
            />
            <Blanket frame={g} />
            {/* phone light on her face */}
            <Light x={1440} y={1000} r={330} color="phone" opacity={0.8} />
            <Dust frame={g} x={1100} y={700} w={800} h={700} />
          </Camera>
        </Stage>
        <Vignette strength={0.9} />
      </AbsoluteFill>
    );
  }

  // phone close-up: the message thread
  const s = f - 62;
  return (
    <AbsoluteFill>
      <Stage bg="#03040a">
        <Defs />
        <g transform={`translate(540 960) scale(${tween(s, [0, 61], [1, 1.12])}) rotate(${tween(s, [0, 61], [-2, 2])}) translate(-540 -960)`}>
          <circle cx={300} cy={300} r={500} fill="url(#moonGlow)" opacity={0.15} />
          <BigPhone frame={g} x={540} y={860} scale={1.08} mode="chat" bubbles={CHAT_1} typingFrom={g < 172 ? 160 : 192} typingTo={g < 172 ? 171 : 204} />
        </g>
      </Stage>
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};
