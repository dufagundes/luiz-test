import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FPS, hit} from './lib/anim';
import {FontGate} from './FontGate';
import {Scene3D} from './Scene3D';
import {BEAT, worldAt} from './story/cowStory';
import {Grade, SpeedLines, UI_FONT} from './ui/Overlays';

// PHASE 1 technical test (10.4 s): the same 3D world and shots as the real episode, cut down to:
// 1) walking in through the doors  2) pushing the cart down the aisle  3) grabbing the milk  4) the shocked face
const SEGMENTS: [number, number][] = [
  [0, 3.4],
  [BEAT.aisle, BEAT.dairy],
  [BEAT.dairy, BEAT.ots],
  [BEAT.zoom, BEAT.pov],
];
export const TEST_FRAMES = Math.round(SEGMENTS.reduce((a, [s, e]) => a + e - s, 0) * FPS);

const storyTime = (u: number) => {
  let acc = 0;
  for (const [s, e] of SEGMENTS) {
    if (u < acc + (e - s)) return s + (u - acc);
    acc += e - s;
  }
  return SEGMENTS[SEGMENTS.length - 1][1] - 1 / FPS;
};

export const CowTest: React.FC = () => {
  const u = useCurrentFrame() / FPS;
  const t = storyTime(u);
  const w = worldAt(t);
  const drama = t >= BEAT.zoom ? 1 : 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#fff1d6'}}>
      <FontGate>
        <Scene3D w={w} />
        <SpeedLines amount={t >= BEAT.shock && t < BEAT.shock + 0.9 ? 1 - (t - BEAT.shock) / 0.9 : 0} t={t} />
        <Grade t={t} drama={drama} flash={0.8 * hit(t, BEAT.shock, 0.12)} />
        <div style={{position: 'absolute', top: 250, left: 90, fontFamily: UI_FONT, fontWeight: 800, fontSize: 44, color: '#fff', background: 'rgba(27,27,47,0.75)', padding: '6px 22px', borderRadius: 18}}>
          3D TECH TEST · {u.toFixed(1)}s
        </div>
      </FontGate>
    </AbsoluteFill>
  );
};
