import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Camera, Stage} from '../components/Camera';
import {Defs, DOOR, Room, WINDOW} from '../components/Room';
import {BigPhone, Bubble} from '../components/Phone';
import {Person} from '../characters/Person';
import {Vignette, Wash} from '../components/Effects';
import {COLORS} from '../lib/constants';
import {blink, easeInOut, easeOut, shake, tween, wobble} from '../lib/anim';
import {Light} from './common';
import {CHAT_1} from './S2Message';
import {DrivewayMom} from './S4Window';
import {OutsideView} from '../components/Room';

export const CHAT_2: Bubble[] = [...CHAT_1, {text: 'Open the window.', at: 572}, {text: 'Let her in.', at: 598, danger: true}];

// Maya standing with her back to the wall next to the window
export const MAYA_WALL = {x: 1880, y: 1760, scale: 1.08};

/** SCENE 5 (17.1–21.0s) — The door handle turns. Her phone buzzes: "Open the window. Let her in." */
export const S5Handle: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + 513;
  const heart = Math.max(0, Math.sin((g * Math.PI * 2) / 18.75)) ** 8; // 96 bpm pulse

  if (f < 50) {
    return (
      <AbsoluteFill>
        <Stage>
          <Defs />
          <Camera x={DOOR.x + DOOR.w - 90} y={DOOR.y + 480} zoom={tween(f, [0, 50], [2.6, 3.3], easeInOut) + heart * 0.04} rotate={tween(f, [0, 50], [6, 9])}>
            <Room frame={g} underDoor={1} feet={1} handleTurn={tween(f, [4, 44], [0, -38], easeInOut) + Math.sin(f * 1.7) * 1.2} />
            <Light x={DOOR.x + DOOR.w - 60} y={DOOR.y + 470} r={140} color="moon" opacity={0.35} />
          </Camera>
        </Stage>
        <Wash opacity={0.15 + heart * 0.15} color={COLORS.danger} blend="overlay" />
        <Vignette strength={0.95} />
      </AbsoluteFill>
    );
  }

  const s = f - 50;
  const buzz = g >= 568 && g < 584 ? Math.sin(g * 3.3) * 8 : 0;
  const reachLatch = tween(s, [44, 68], [0, 1], easeOut);
  return (
    <AbsoluteFill>
      <Stage>
        <Defs />
        <Camera x={MAYA_WALL.x + 120 + wobble(f, 9) * 5} y={1060} zoom={tween(s, [0, 68], [1.45, 1.7]) + heart * 0.03} rotate={-7}>
          <Room
            frame={g}
            showPhone={false}
            outside={
              <OutsideView frame={g}>
                <DrivewayMom frame={g} wave={false} />
              </OutsideView>
            }
          />
          <Person
            look="maya"
            {...MAYA_WALL}
            frame={g}
            headTurn={tween(s, [0, 40], [-0.4, 0.5])}
            headTilt={-5}
            lookX={tween(s, [0, 40], [-1, 0.6])}
            lookY={0.6}
            eyeOpen={1.4 * blink(s, 30, 200)}
            brow={1}
            mouth={s > 30 ? 'gasp' : 'frown'}
            mouthOpen={0.4}
            shiver={0.9}
            armL={{shoulder: -35, elbow: -120}}
            armR={{shoulder: tween(reachLatch, [0, 1], [10, -125]), elbow: tween(reachLatch, [0, 1], [10, -20])}}
            holdPhone="L"
            phoneGlow={1}
          />
          <Light x={MAYA_WALL.x} y={1150} r={320} color="phone" opacity={0.7} />
          <Light x={WINDOW.x + 180} y={WINDOW.y + 300} r={600} color="moon" opacity={0.3} />
        </Camera>
        {/* phone insert */}
        <g transform={`translate(${buzz} 0)`}>
          <BigPhone frame={g} x={700} y={tween(s, [0, 10], [1300, 600], easeOut)} scale={0.66} rotate={6} mode="chat" bubbles={CHAT_2} typingFrom={588} typingTo={598} />
        </g>
      </Stage>
      <Wash opacity={0.1 + heart * 0.18} color={COLORS.danger} blend="overlay" />
      <Vignette strength={0.95} />
    </AbsoluteFill>
  );
};

export {shake};
