import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {Camera, Stage} from '../components/Camera';
import {Defs, OutsideView, Room, WINDOW} from '../components/Room';
import {Person} from '../characters/Person';
import {Flash, Grain, Vignette} from '../components/Effects';
import {COLORS, FPS} from '../lib/constants';
import {easeIn, easeInOut, easeOut, tween, wobble} from '../lib/anim';
import {Light} from './common';
import {MAYA_WALL} from './S5Handle';

const FONT = "'Montserrat', sans-serif";

/** The double: Maya's face, pressed against the outside of the glass, holding a glowing phone. */
const Double: React.FC<{g: number; lit: number; tilt: number}> = ({g, lit, tilt}) => (
  <g>
    <Person
      look="double"
      x={WINDOW.x + 272}
      y={WINDOW.y + 740}
      scale={0.95}
      frame={g}
      headTilt={tilt}
      lookX={-0.4}
      lookY={0.2}
      eyeOpen={1.1}
      brow={-0.6}
      mouth="grin"
      armL={{shoulder: 158, elbow: 8}}
      armR={{shoulder: 40, elbow: 120}}
      holdPhone="R"
      phoneGlow={1}
      dark={0.75 - lit * 0.6}
    />
    {/* palm squashed on the glass */}
    <ellipse cx={WINDOW.x + 55} cy={WINDOW.y + 185} rx={34} ry={40} fill="#c9d4dc" opacity={0.25 + lit * 0.4} />
    {/* phone light from below on her face */}
    <circle cx={WINDOW.x + 272} cy={WINDOW.y + 260} r={200} fill="url(#phoneGlow)" opacity={0.25 + lit * 0.35} style={{mixBlendMode: 'screen'}} />
  </g>
);

/** SCENE 7 (26.0–30.0s) — Maya turns to the window. Outside, holding a phone… is Maya. Title card. */
export const S7Reveal: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + 780;

  // ---- final title card (after the impact at 28.95s) ----
  if (g >= 868) {
    const t = g - 868;
    const pop = spring({frame: t, fps: FPS, config: {damping: 14, stiffness: 120}});
    const glitch = t < 6 || (t > 14 && t < 17) ? 1 : 0;
    return (
      <AbsoluteFill style={{background: '#020205'}}>
        <Grain frame={g} opacity={0.12} />
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 50}}>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 118,
              lineHeight: 1,
              color: '#f2f4fb',
              textAlign: 'center',
              letterSpacing: 4,
              transform: `scale(${0.85 + pop * 0.15}) translateX(${glitch * 12}px)`,
              textShadow: glitch ? `-8px 0 ${COLORS.danger}, 8px 0 #4fd1ff` : `0 0 40px rgba(255,59,78,0.35)`,
            }}
          >
            MESSAGE
            <br />
            <span style={{fontSize: 64, letterSpacing: 18, color: COLORS.danger}}>FROM</span>
            <br />
            TOMORROW
          </div>
          <div
            style={{
              marginTop: 40,
              background: 'rgba(242,244,251,0.95)',
              borderRadius: 34,
              padding: '26px 40px',
              width: 860,
              opacity: tween(t, [8, 14], [0, 1]),
              transform: `translateY(${tween(t, [8, 16], [-40, 0], easeOut)}px)`,
              fontFamily: FONT,
            }}
          >
            <div style={{fontWeight: 800, fontSize: 40, color: '#1a1d2b'}}>Me (2034) · now</div>
            <div style={{fontWeight: 900, fontSize: 60, color: COLORS.danger, marginTop: 6}}>Next time, let me in.</div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // ---- Maya turns from Mom toward the window ----
  if (f < 32) {
    const turn = tween(f, [4, 26], [-0.8, 0.8], easeInOut);
    return (
      <AbsoluteFill>
        <Stage>
          <Defs />
          <Camera x={MAYA_WALL.x + wobble(f, 2) * 4} y={1050} zoom={tween(f, [0, 32], [2.0, 2.25])} rotate={3}>
            <Room frame={g} doorOpen={1} hallLight={1} showPhone={false} outside={<OutsideView frame={g} />} />
            <Person
              look="maya"
              {...MAYA_WALL}
              frame={g}
              headTurn={turn}
              lookX={turn * 1.2}
              lookY={-0.2}
              eyeOpen={tween(f, [18, 28], [1.1, 1.45])}
              brow={1}
              mouth={f > 22 ? 'gasp' : 'closed'}
              mouthOpen={0.6}
              armL={{shoulder: -35, elbow: -120}}
              armR={{shoulder: 10, elbow: 10}}
              holdPhone="L"
              phoneGlow={0.7}
            />
            <Light x={MAYA_WALL.x - 300} y={1050} r={500} color="warm" opacity={0.3} />
          </Camera>
        </Stage>
        <Vignette strength={0.85} />
      </AbsoluteFill>
    );
  }

  // ---- whip pan + slow push-in to the window ----
  const s = f - 32;
  const whip = tween(s, [0, 8], [0, 1], easeIn);
  const camX = tween(s, [0, 8], [MAYA_WALL.x + 300, WINDOW.x + 250], easeOut);
  const zoom = tween(s, [8, 56], [1.55, 2.5], easeInOut);
  const lightning = Math.max(tween(g, [841, 843], [0, 1]) * tween(g, [843, 856], [1, 0]), tween(g, [848, 849], [0, 0.6]) * tween(g, [849, 853], [1, 0]));
  const lit = tween(g, [841, 845], [0, 1]);
  const blurPx = s < 8 ? Math.sin(whip * Math.PI) * 28 : 0;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: blurPx > 0.5 ? `blur(${blurPx}px)` : undefined}}>
        <Stage>
          <Defs />
          <Camera x={camX + wobble(f, 8) * 3} y={tween(s, [8, 56], [760, 670])} zoom={zoom} rotate={tween(s, [8, 56], [0, -4])}>
            <Room
              frame={g}
              doorOpen={1}
              hallLight={0.6}
              moon={0.35}
              showPhone={false}
              lightning={lightning}
              outside={
                <OutsideView frame={g} lightning={lightning * 0.5}>
                  <g transform={`translate(${-WINDOW.x} ${-WINDOW.y})`}>
                    <Double g={g} lit={lit} tilt={tween(s, [10, 56], [0, -12])} />
                  </g>
                </OutsideView>
              }
            />
            {/* breath fog on the glass */}
            <ellipse cx={WINDOW.x + 272} cy={WINDOW.y + 250} rx={80} ry={50} fill="#dfe8ff" opacity={0.08 + 0.05 * Math.sin(g * 0.15)} />
          </Camera>
        </Stage>
      </AbsoluteFill>
      <Flash opacity={lightning * 0.55} color="#e6eeff" />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};
