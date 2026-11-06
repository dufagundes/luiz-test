import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Camera, Stage} from '../components/Camera';
import {Blanket, Defs, DOOR, Room} from '../components/Room';
import {Person} from '../characters/Person';
import {Vignette, Wash} from '../components/Effects';
import {COLORS} from '../lib/constants';
import {blink, easeInOut, easeOut, shake, tween, wobble} from '../lib/anim';
import {Dust, Light} from './common';
import {MAYA_BED} from './S2Message';

// knock sound effects land on these global frames (9.15s, 9.55s, 9.95s)
const KNOCKS = [274, 286, 298];

/** SCENE 3 (7.6–13.1s) — Three slow knocks. A voice that sounds like Mom. */
export const S3Knock: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + 228;

  const knockShake = KNOCKS.reduce((a, k) => a + shake(g, k, 7, 5, k), 0);
  const camJolt = KNOCKS.reduce((a, k) => a + shake(g, k, 12, 6, k + 3), 0);

  if (f < 92) {
    const zoom = tween(f, [0, 92], [1.12, 1.5], easeInOut);
    return (
      <AbsoluteFill>
        <Stage>
          <Defs />
          <Camera x={DOOR.x + DOOR.w / 2 + 30} y={tween(f, [0, 92], [1080, 1180]) + camJolt} zoom={zoom} rotate={-3 + wobble(f, 4) * 0.5}>
            <Room frame={g} doorShake={knockShake} underDoor={tween(f, [4, 26], [0, 1])} feet={tween(f, [26, 40], [0, 1])} moon={0.8} />
            {/* dust shaken loose by the knocks */}
            {g > KNOCKS[0] ? <Dust frame={g} x={DOOR.x} y={DOOR.y - 40} w={DOOR.w} h={900} n={30} fall={2.2} color="#9aa6c8" /> : null}
            <Light x={DOOR.x + DOOR.w / 2} y={DOOR.y + DOOR.h + 40} r={360} color="warm" opacity={tween(f, [4, 26], [0, 0.35])} />
          </Camera>
        </Stage>
        <Wash opacity={tween(g, [304, 320], [0, 0.25])} color={COLORS.danger} blend="overlay" />
        <Vignette strength={0.92} />
      </AbsoluteFill>
    );
  }

  // Maya's reaction: frozen in bed, blanket pulled up, eyes on the door
  const s = f - 92;
  const look = tween(s, [0, 12], [0, -1], easeOut);
  return (
    <AbsoluteFill>
      <Stage>
        <Defs />
        <Camera x={1480 + wobble(f, 7) * 5} y={980} zoom={tween(s, [0, 73], [1.75, 2.05])} rotate={tween(s, [0, 73], [2, 5])}>
          <Room frame={g} showPhone={false} />
          <Person
            look="maya"
            {...MAYA_BED}
            pose="sit"
            frame={g}
            headTurn={-0.6}
            headTilt={-4}
            lookX={look}
            lookY={0.1}
            eyeOpen={1.35 * blink(s, 50, 120)}
            brow={1}
            mouth="frown"
            shiver={0.8}
            armL={{shoulder: -30, elbow: -130}}
            armR={{shoulder: 35, elbow: 130}}
            holdPhone="R"
            phoneGlow={0.6}
            lean={-8}
          />
          <Blanket frame={g} lift={tween(s, [0, 20], [0, 60], easeOut)} />
          <Light x={1420} y={1040} r={260} color="phone" opacity={0.55} />
          <Light x={1200} y={900} r={500} color="red" opacity={0.18 + 0.1 * Math.sin(s * 0.3)} />
        </Camera>
      </Stage>
      <Wash opacity={0.2} color={COLORS.danger} blend="overlay" />
      <Vignette strength={0.95} />
    </AbsoluteFill>
  );
};
