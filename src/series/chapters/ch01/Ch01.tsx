import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from './timeline.json';
import {Camera, Stage} from '../../../components/Camera';
import {Flash, Grain, Vignette, Wash} from '../../../components/Effects';
import {blink, easeIn, easeInOut, easeOut, shake, tween, wobble} from '../../../lib/anim';
import {Character, HandPhone} from '../../rig/Character';
import {MILO, NORA, THEO} from '../../cast';
import {Town} from '../../locations/Town';
import {Attic, ATTIC} from '../../locations/Attic';
import {SignalPhone} from '../../props/SignalPhone';
import {MiloDrawing} from '../../props/MiloDrawing';
import {HamRadio} from '../../props/HamRadio';
import {Glow, SeriesDefs} from '../../ui/Glow';
import {ChapterTitle, ChoiceCard, Countdown, SeriesSubtitles, Timeline} from '../../ui/SeriesUI';
import {T} from '../../theme';

const TL = timelineJson as Timeline;
export const CH01_DURATION = TL.durationInFrames;

/** lip-sync: 0..1 mouth openness for a line at global frame g */
const speak = (g: number, id: string) => {
  const line = TL.lines.find((l) => l.id === id);
  const w = line?.words.find((wd) => g >= wd.start && g < wd.end - 1);
  return w ? 0.25 + 0.75 * Math.abs(Math.sin((g - w.start) * 0.85)) : 0;
};
const L = (id: string) => TL.lines.find((l) => l.id === id)!;

// ---------------------------------------------------------------- scene boundaries (frames)
const S = {
  town: [0, 150],
  phone: [150, 300],
  atticWide: [300, 420],
  radio: [420, 560],
  noraFace: [560, 650],
  theoWindow: [650, 720],
  theoIn: [720, 805],
  milo: [805, 880],
  drawing: [880, 990],
  windowCheck: [990, 1022],
  radioRed: [1022, 1088],
  theoPhone: [1088, 1128],
  tower: [1128, 1185],
  confront: [1185, 1278],
  blackout: [1278, 1378],
  choice: [1378, CH01_DURATION],
} as const;

const NORA_DESK = {x: 1180, y: 1560, scale: 1.05};
const THEO_IN = {x: 960, y: 1580, scale: 1.0};

/* ================================================================ scenes */

/** 0–5s: every window in town lights up phone-blue at once */
const SceneTown: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Stage bg={T.sky0}>
        <SeriesDefs />
        <Town frame={f} zoom={tween(f, [0, 150], [1.0, 1.22], easeInOut)} focusX={560} focusY={1150} camX={tween(f, [0, 150], [-40, 40])} phonesOnAt={2} phonesSpread={34} />
      </Stage>
      <Flash opacity={tween(f, [0, 4], [0.35, 0])} color={T.phone} />
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};

/** 5–10s: the message itself */
const ScenePhone: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.phone[0];
  const buzz = f < 14 ? Math.sin(f * 3.1) * 9 : 0;
  return (
    <AbsoluteFill>
      <Stage bg="#04050a">
        <SeriesDefs />
        <Glow x={540} y={900} r={900} color="phone" opacity={0.25} />
        <g transform={`translate(540 960) scale(${tween(f, [0, 150], [1, 1.14], easeInOut)}) rotate(${tween(f, [0, 150], [-3, 2])}) translate(-540 -960)`}>
          <SignalPhone frame={g} x={540 + buzz} y={880} scale={1.12} mode="lock" notifAt={S.phone[0] + 3} id="lock" glitch={g > 280 ? tween(g, [280, 300], [0, 1]) : 0} />
        </g>
      </Stage>
      <Wash opacity={0.1 + 0.08 * Math.sin(f * 0.3)} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};

/** The attic, shared by most interior shots. Props describe the moment. */
const AtticShot: React.FC<{
  g: number;
  cam: {x: number; y: number; zoom: number; rotate?: number};
  children?: React.ReactNode;
  radioPower?: number;
  radioDanger?: number;
  radioWave?: number;
  doorOpen?: number;
  doorway?: React.ReactNode;
  outside?: React.ReactNode;
  windowOpen?: number;
  power?: number;
  lightning?: number;
}> = ({g, cam, children, ...room}) => (
  <Stage bg="#06060c">
    <SeriesDefs />
    <Camera x={cam.x} y={cam.y} zoom={cam.zoom} rotate={cam.rotate ?? 0}>
      <Attic frame={g} {...room} />
      {children}
    </Camera>
  </Stage>
);

const radioWaveAt = (g: number) => Math.max(speak(g, 'r1'), speak(g, 'r2'));

/** 10–14s wide attic: Nora with her phone, then the radio switches itself on */
const SceneAtticWide: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.atticWide[0];
  const on = tween(g, [406, 412], [0, 1]);
  const startle = tween(g, [408, 418], [0, 1], easeOut);
  return (
    <AbsoluteFill>
      <AtticShot g={g} cam={{x: tween(f, [0, 120], [1000, 1140]), y: 1130, zoom: tween(f, [0, 120], [0.86, 1.05], easeInOut)}} radioPower={on}>
        <Character
          who={NORA}
          {...NORA_DESK}
          frame={g}
          headTurn={tween(startle, [0, 1], [-0.1, 0.75])}
          headTilt={tween(startle, [0, 1], [8, -2])}
          lookX={tween(startle, [0, 1], [-0.2, 1])}
          lookY={tween(startle, [0, 1], [0.9, 0])}
          eyeOpen={tween(startle, [0, 1], [1, 1.35]) * blink(g, 5)}
          brow={tween(startle, [0, 1], [-0.2, 0.9])}
          mouth={startle > 0.5 ? 'o' : 'closed'}
          armL={{shoulder: -30, elbow: -110}}
          armR={{shoulder: 30, elbow: 120}}
          hold={{side: 'R', item: <HandPhone />}}
          lean={tween(startle, [0, 1], [0, -6])}
        />
        <Glow x={NORA_DESK.x - 40} y={1000} r={260} color="phone" opacity={0.5} />
        <Glow x={1600} y={1060} r={420} color="amber" opacity={0.6 * on} />
      </AtticShot>
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};

/** 14–18.6s: radio close-up, the voice speaks */
const SceneRadio: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.radio[0];
  const w = radioWaveAt(g);
  return (
    <AbsoluteFill>
      <AtticShot g={g} cam={{x: tween(f, [0, 140], [1480, 1540]) + wobble(f, 3) * 4, y: 1020, zoom: tween(f, [0, 140], [1.75, 2.15], easeInOut), rotate: -3}} radioPower={1} radioWave={w}>
        <Character
          who={NORA}
          {...NORA_DESK}
          frame={g}
          headTurn={0.8}
          lookX={1}
          lookY={0.3}
          eyeOpen={1.3 * blink(g, 12, 110)}
          brow={0.9}
          mouth="closed"
          armL={{shoulder: -30, elbow: -110}}
          armR={{shoulder: -60, elbow: -40}}
          lean={-10}
        />
        <Glow x={1600} y={1060} r={420} color="amber" opacity={0.55 + w * 0.3} />
      </AtticShot>
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 18.6–21.6s: Nora's face. The voice sounded exactly like her. */
const SceneNoraFace: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.noraFace[0];
  return (
    <AbsoluteFill>
      <AtticShot g={g} cam={{x: NORA_DESK.x + 20, y: tween(f, [0, 90], [960, 930]), zoom: tween(f, [0, 90], [2.3, 2.9], easeIn), rotate: tween(f, [0, 90], [0, 4])}} radioPower={1}>
        <Character
          who={NORA}
          {...NORA_DESK}
          frame={g}
          headTurn={0.35}
          lookX={0.5}
          eyeOpen={tween(f, [40, 60], [1.2, 1.45])}
          brow={1}
          mouth={f > 55 ? 'gasp' : 'frown'}
          mouthOpen={0.4}
          shiver={0.6}
          armL={{shoulder: -30, elbow: -110}}
          armR={{shoulder: -10, elbow: 20}}
        />
        <Glow x={NORA_DESK.x + 200} y={950} r={420} color="amber" opacity={0.5} />
      </AtticShot>
      {/* the radio voice and Nora's voice overlap: a waveform ghost over her face */}
      <Wash opacity={tween(g, [620, 650], [0, 0.25])} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.92} />
    </AbsoluteFill>
  );
};

/** 21.6–24s: tap tap tap. Theo at the window in the rain. */
const SceneTheoWindow: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.theoWindow[0];
  const knock = Math.max(0, Math.sin((g - 650) * 0.9)) * (g < 668 ? 1 : 0) * 14;
  const outside = (
    <Character
      who={THEO}
      x={1000}
      y={1250}
      scale={1}
      frame={g}
      headTurn={0.1}
      lookX={0.2}
      lookY={0.5}
      eyeOpen={1.15 * blink(g, 3)}
      brow={0.5}
      mouth={speak(g, 't1') > 0 ? 'talk' : 'smile'}
      mouthOpen={speak(g, 't1')}
      armR={{shoulder: -150, elbow: -30 + knock}}
      wet
      dark={0.25}
    />
  );
  return (
    <AbsoluteFill>
      <AtticShot g={g} cam={{x: 1000, y: 680, zoom: tween(f, [0, 70], [2.0, 2.3]), rotate: 2}} outside={outside} radioPower={1}>
        <Glow x={1000} y={640} r={240} color="phone" opacity={0.25} />
      </AtticShot>
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 24–26.8s: Theo inside, dripping. Best friends since they were six. */
const SceneTheoIn: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.theoIn[0];
  return (
    <AbsoluteFill>
      <AtticShot g={g} cam={{x: tween(f, [0, 85], [1060, 1090]), y: 1130, zoom: tween(f, [0, 85], [1.18, 1.32])}} radioPower={1} windowOpen={0.9}>
        <Character
          who={THEO}
          {...THEO_IN}
          frame={g}
          headTurn={0.5}
          lookX={0.8}
          eyeOpen={blink(g, 20)}
          brow={0.4}
          mouth="smile"
          armL={{shoulder: -10, elbow: -10}}
          armR={{shoulder: -150 + Math.sin(f * 0.25) * 15, elbow: -20}}
          wet
        />
        <Character
          who={NORA}
          {...NORA_DESK}
          frame={g}
          headTurn={-0.7}
          lookX={-1}
          eyeOpen={1.1 * blink(g, 40)}
          brow={0.6}
          mouth="o"
          mouthOpen={0.2}
          armL={{shoulder: -10, elbow: -20}}
          armR={{shoulder: 10, elbow: 20}}
          hold={{side: 'R', item: <HandPhone glow={0.6} />}}
        />
        <Glow x={1600} y={1060} r={420} color="amber" opacity={0.5} />
      </AtticShot>
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};

const Notebook: React.FC = () => (
  <g transform="translate(-10 -40) rotate(-8)">
    <rect x={-70} y={-50} width={140} height={100} rx={6} fill="#f3ecd9" stroke="#b5aa90" strokeWidth={4} />
    <circle cx={30} cy={-5} r={14} fill="#0b0a0e" />
    <path d="M -40 30 L -10 -20 L 10 30" stroke="#e9b72f" strokeWidth={6} fill="none" />
  </g>
);

/** 26.8–29.3s: the door creaks. Milo with his notebook. */
const SceneMilo: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.milo[0];
  const milo = (
    <Character
      who={MILO}
      x={ATTIC.door.x + 150}
      y={ATTIC.door.y + ATTIC.door.h + 4}
      frame={g}
      headTurn={0.3}
      lookX={0.6}
      eyeOpen={0.95 * blink(g, 7, 140)}
      brow={0.3}
      mouth={speak(g, 'm1') > 0 ? 'talk' : 'closed'}
      mouthOpen={speak(g, 'm1')}
      armL={{shoulder: -40, elbow: -100}}
      armR={{shoulder: 40, elbow: 100}}
      hold={{side: 'R', item: <Notebook />}}
      dark={0.15}
    />
  );
  return (
    <AbsoluteFill>
      <AtticShot g={g} cam={{x: 360, y: tween(f, [0, 75], [1180, 1240]), zoom: tween(f, [0, 75], [1.55, 1.85], easeInOut), rotate: -2}} doorOpen={tween(f, [0, 12], [0, 1], easeOut)} doorway={milo} radioPower={1}>
        <Glow x={330} y={1150} r={360} color="warm" opacity={0.25} />
      </AtticShot>
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 29.3–33s: the drawing. This room. This moment. And someone behind Theo. */
const SceneDrawing: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.drawing[0];
  const zoom = tween(g, [880, 958, 990], [1.0, 1.05, 1.9], easeInOut);
  const fx = tween(g, [950, 990], [400, 545]);
  const fy = tween(g, [950, 990], [310, 300]);
  return (
    <AbsoluteFill>
      <Stage bg="#0c0b10">
        <SeriesDefs />
        <g transform={`translate(540 860) rotate(${tween(f, [0, 110], [-4, 1])}) scale(${1.25 * zoom}) translate(${-fx} ${-fy})`}>
          <MiloDrawing frame={g} figureGlow={tween(g, [960, 990], [0, 1])} />
        </g>
        {/* Milo's fingers holding the page */}
        <circle cx={150} cy={1300} r={46} fill={MILO.palette.skin} />
        <circle cx={930} cy={1290} r={46} fill={MILO.palette.skin} />
      </Stage>
      <Wash opacity={tween(g, [960, 990], [0, 0.3])} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.8} />
    </AbsoluteFill>
  );
};

/** 33–34s: she looks behind Theo, at the window. Lightning: for a moment, someone is there. */
const SceneWindowCheck: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.windowCheck[0];
  const flash = tween(g, [1004, 1006], [0, 1]) * tween(g, [1006, 1014], [1, 0]);
  const figure = flash > 0.05 ? <Character who={THEO} x={1000} y={1230} frame={g} dark={0.97} armL={{shoulder: 10, elbow: 0}} armR={{shoulder: -10, elbow: 0}} /> : null;
  return (
    <AbsoluteFill>
      <AtticShot g={g} cam={{x: 1000, y: 700, zoom: tween(f, [0, 32], [1.6, 1.9]), rotate: 3}} outside={figure} lightning={flash * 0.8} radioPower={1}>
        <Character who={THEO} x={THEO_IN.x - 40} y={THEO_IN.y + 120} scale={1.35} frame={g} headTurn={-0.2} eyeOpen={blink(g, 2)} dark={0.55} />
      </AtticShot>
      <Flash opacity={flash * 0.4} color="#e6eeff" />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 34–36.3s: the radio turns red. "Don't trust Theo." */
const SceneRadioRed: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.radioRed[0];
  const sh = shake(f, 0, 10, 10);
  return (
    <AbsoluteFill>
      <Stage bg="#06060c">
        <SeriesDefs />
        <Glow x={540} y={900} r={900} color="red" opacity={0.45 + radioWaveAt(g) * 0.3} />
        <g transform={`translate(${540 + sh} 900) scale(${tween(f, [0, 66], [2.4, 2.7])}) rotate(-4) translate(-180 -110)`}>
          <HamRadio frame={g} power={1} danger={1} wave={radioWaveAt(g)} />
        </g>
      </Stage>
      <Wash opacity={0.25} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 36.3–37.6s: Theo's phone. The same message. Dated three weeks ago. */
const SceneTheoPhone: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.theoPhone[0];
  return (
    <AbsoluteFill>
      <Stage bg="#04050a">
        <SeriesDefs />
        <g transform={`translate(540 960) scale(${tween(f, [0, 40], [1.05, 1.2])}) rotate(${tween(f, [0, 40], [4, 1])}) translate(-540 -960)`}>
          <SignalPhone frame={g} x={540} y={900} scale={1.1} mode="thread" notifAt={S.theoPhone[0] - 6} owner="Theo" dateLabel="FRI, OCT 23 · 11:47 PM" id="theo" />
        </g>
        {/* Theo's thumb */}
        <ellipse cx={980} cy={1480} rx={70} ry={110} fill={THEO.palette.skin} transform="rotate(-30 980 1480)" />
      </Stage>
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};

/** 37.6–39.5s: through the rainy window, the tower on Cutter's Hill. "Come to the tower. Alone." */
const SceneTower: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.tower[0];
  return (
    <AbsoluteFill>
      <AtticShot g={g} cam={{x: ATTIC.window.x + 220, y: ATTIC.window.y + 210, zoom: tween(f, [0, 57], [3.2, 4.6], easeIn)}} radioPower={1} radioDanger={1}>
        <Glow x={ATTIC.window.x + 220} y={ATTIC.window.y + 148} r={90} color="red" opacity={0.7 * ((g % 40) < 20 ? 1 : 0.35)} />
      </AtticShot>
      <Vignette strength={0.95} />
    </AbsoluteFill>
  );
};

/** 39.5–42.6s: "You knew?" / "Nora, I can explain. Please." */
const SceneConfront: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.confront[0];
  const onNora = g < 1212;
  const camX = onNora ? NORA_DESK.x - 30 : THEO_IN.x + 40;
  return (
    <AbsoluteFill>
      <AtticShot g={g} cam={{x: camX + wobble(f, 5) * 4, y: 1000, zoom: onNora ? 2.3 : tween(g, [1212, 1278], [2.0, 2.4]), rotate: onNora ? -3 : 3}} radioPower={1} radioDanger={1} windowOpen={0.9}>
        <Character
          who={THEO}
          {...THEO_IN}
          frame={g}
          headTurn={0.55}
          lookX={0.9}
          eyeOpen={1.1 * blink(g, 9)}
          brow={1}
          mouth={speak(g, 't2') > 0 ? 'talk' : 'grimace'}
          mouthOpen={speak(g, 't2')}
          armL={{shoulder: -60, elbow: -70}}
          armR={{shoulder: -120, elbow: -40}}
          hold={{side: 'R', item: <HandPhone glow={0.7} />}}
          wet
        />
        <Character
          who={NORA}
          {...NORA_DESK}
          frame={g}
          headTurn={-0.75}
          lookX={-1}
          eyeOpen={1.25}
          brow={-0.7}
          mouth={speak(g, 'no1') > 0 ? 'talk' : 'frown'}
          mouthOpen={speak(g, 'no1')}
          armL={{shoulder: -5, elbow: -5}}
          armR={{shoulder: 5, elbow: 5}}
          shiver={0.3}
        />
        <Glow x={1600} y={1060} r={500} color="red" opacity={0.4} />
      </AtticShot>
      <Wash opacity={0.12} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 42.6–46s: across town, the lights go out. The tower turns white. */
const SceneBlackout: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.blackout[0];
  const lightning = tween(g, [1349, 1351], [0, 1]) * tween(g, [1351, 1362], [1, 0]);
  return (
    <AbsoluteFill>
      <Stage bg={T.sky0}>
        <SeriesDefs />
        <Town
          frame={g}
          zoom={tween(f, [0, 100], [1.05, 1.3], easeInOut)}
          focusX={760}
          focusY={900}
          camX={tween(f, [0, 100], [60, 120])}
          phonesOnAt={-100}
          blackoutAt={1296}
          blackoutSpread={36}
          towerWhiteAt={1342}
          lightning={lightning}
          atticLight={tween(g, [1328, 1332], [1, 0])}
        />
      </Stage>
      <Flash opacity={lightning * 0.35} color="#e6eeff" />
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};

const ThumbTheo: React.FC = () => (
  <svg viewBox="-110 -700 220 260" width={150} height={150}>
    <Character who={THEO} frame={0} headTurn={0.2} brow={0.8} mouth="grimace" />
  </svg>
);
const ThumbTower: React.FC = () => (
  <svg viewBox="-80 -470 160 180" width={150} height={150}>
    <SeriesDefs />
    <path d="M -50 40 L 0 -420 L 50 40" stroke="#c9d3ff" strokeWidth={10} fill="none" />
    <path d="M -36 -80 L 36 -80 M -26 -180 L 26 -180 M -14 -300 L 14 -300" stroke="#c9d3ff" strokeWidth={8} />
    <Glow x={0} y={-430} r={70} color="white" opacity={1} />
    <circle cx={0} cy={-430} r={14} fill="#fff" />
  </svg>
);

/** 46–58s: the decision */
const SceneChoiceBg: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.choice[0];
  return (
    <AbsoluteFill>
      <Stage bg={T.sky0}>
        <SeriesDefs />
        <Town frame={g} zoom={1.3 + f * 0.0006} focusX={760} focusY={900} camX={120} phonesOnAt={-100} blackoutAt={-100} towerWhiteAt={1342} atticLight={0} />
      </Stage>
    </AbsoluteFill>
  );
};

/* ================================================================ the chapter */
const SCENES: [readonly [number, number], React.FC][] = [
  [S.town, SceneTown],
  [S.phone, ScenePhone],
  [S.atticWide, SceneAtticWide],
  [S.radio, SceneRadio],
  [S.noraFace, SceneNoraFace],
  [S.theoWindow, SceneTheoWindow],
  [S.theoIn, SceneTheoIn],
  [S.milo, SceneMilo],
  [S.drawing, SceneDrawing],
  [S.windowCheck, SceneWindowCheck],
  [S.radioRed, SceneRadioRed],
  [S.theoPhone, SceneTheoPhone],
  [S.tower, SceneTower],
  [S.confront, SceneConfront],
  [S.blackout, SceneBlackout],
  [S.choice, SceneChoiceBg],
];

export const Chapter01: React.FC = () => {
  const frame = useCurrentFrame();
  const dip = Math.max(tween(frame, [0, 2], [1, 0]), tween(frame, [296, 300], [0, 1]) * tween(frame, [300, 306], [1, 0]), tween(frame, [1274, 1278], [0, 1]) * tween(frame, [1278, 1284], [1, 0]));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SCENES.map(([[from, to], C], i) => (
        <Sequence key={i} from={from} durationInFrames={to - from}>
          <C />
        </Sequence>
      ))}
      <Flash opacity={dip} color="#000" />
      <Grain frame={frame} opacity={0.07} />
      <ChapterTitle at={306} chapter={1} title="11:47" hold={80} />
      <Countdown zeroFrame={8} show={frame >= 160 ? 1 : 0} urgent={frame >= S.blackout[0]} />
      <SeriesSubtitles timeline={TL} />
      <ChoiceCard
        at={S.choice[0]}
        aAt={L('n8').words.find((w) => w.w === 'A:')!.start}
        bAt={L('n8').words.find((w) => w.w === 'B:')!.start}
        ctaAt={L('n9').start}
        voteAt={L('n9').end + 6}
        chapter={1}
        choice={{
          question: 'Theo lied for 3 weeks. What should Nora do?',
          a: 'Let Theo explain',
          b: 'Go to the tower alone',
          aIcon: <ThumbTheo />,
          bIcon: <ThumbTower />,
        }}
      />
      <Audio src={staticFile('series/ch01/soundtrack.wav')} />
    </AbsoluteFill>
  );
};
