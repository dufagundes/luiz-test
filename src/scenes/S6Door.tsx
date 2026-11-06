import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Camera, Stage} from '../components/Camera';
import {Defs, DOOR, Room} from '../components/Room';
import {Person} from '../characters/Person';
import {Flash, Vignette} from '../components/Effects';
import {blink, easeInOut, easeOut, shake, tween, wobble} from '../lib/anim';
import {Light, speak} from './common';

/** The real Mom standing in the doorway (world coords, drawn inside the doorway clip) */
const DoorwayMom: React.FC<{g: number; talk?: number; step?: number}> = ({g, talk = 0, step = 0}) => (
  <Person
    look="mom"
    x={DOOR.x + DOOR.w / 2 + step}
    y={DOOR.y + DOOR.h + 4}
    scale={1.12}
    frame={g}
    headTurn={0.45}
    headTilt={5}
    lookX={0.9}
    lookY={0.2}
    eyeOpen={1.05 * blink(g, 11, 70)}
    brow={0.8}
    mouth={talk > 0 ? 'talk' : 'frown'}
    mouthOpen={talk}
    armL={{shoulder: -12, elbow: -20}}
    armR={{shoulder: 18 + Math.sin(g * 0.08) * 3, elbow: 70}}
    dark={0.2}
  />
);

/** SCENE 6 (21.0–26.0s) — The door flies open. It's Mom. The real one. */
export const S6Door: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + 631;
  const open = tween(f, [0, 7], [0, 1], easeOut);
  const jolt = shake(f, 0, 26, 8);
  const flash = tween(f, [0, 10], [0.6, 0]);

  if (f < 75) {
    return (
      <AbsoluteFill>
        <Stage>
          <Defs />
          <Camera x={tween(f, [0, 75], [760, 640], easeInOut) + jolt} y={1240 + jolt * 0.6} zoom={tween(f, [0, 75], [0.95, 1.12], easeInOut)}>
            <Room frame={g} doorOpen={open} hallLight={1} doorway={<DoorwayMom g={g} />} showPhone={false} />
            <Light x={DOOR.x + DOOR.w / 2} y={DOOR.y + DOOR.h / 2} r={900} color="warm" opacity={0.45} />
            {/* Maya in the foreground, turning toward the door */}
            <Person
              look="maya"
              x={1130}
              y={1960}
              scale={1.45}
              frame={g}
              headTurn={tween(f, [0, 12], [0.2, -0.85], easeOut)}
              lookX={-1}
              lookY={-0.3}
              eyeOpen={1.35}
              brow={0.9}
              mouth="gasp"
              mouthOpen={tween(f, [0, 8], [0.2, 0.7])}
              armL={{shoulder: -20, elbow: -40}}
              armR={{shoulder: -10, elbow: 125}}
              holdPhone="R"
              phoneGlow={0.8}
              dark={0.35}
            />
            <Light x={1150} y={1100} r={500} color="warm" opacity={0.25} />
          </Camera>
        </Stage>
        <Flash opacity={flash} color="#ffe2b0" />
        <Vignette strength={0.75} color="20,8,0" />
      </AbsoluteFill>
    );
  }

  // Mom medium close-up: "Maya? Who are you texting?"
  const s = f - 75;
  return (
    <AbsoluteFill>
      <Stage>
        <Defs />
        <Camera x={DOOR.x + DOOR.w / 2 + 20 + wobble(f, 6) * 4} y={tween(s, [0, 74], [860, 830])} zoom={tween(s, [0, 74], [1.75, 1.95], easeInOut)} rotate={-2}>
          <Room frame={g} doorOpen={1} hallLight={1} doorway={<DoorwayMom g={g} talk={speak(g, 'm2')} />} showPhone={false} />
          <Light x={DOOR.x + DOOR.w / 2 + 60} y={800} r={420} color="warm" opacity={0.35} />
        </Camera>
      </Stage>
      <Vignette strength={0.8} color="20,8,0" />
    </AbsoluteFill>
  );
};
