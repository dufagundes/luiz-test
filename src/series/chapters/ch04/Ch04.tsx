import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from './timeline.json';
import {Camera, Stage} from '../../../components/Camera';
import {Flash, Grain, Vignette, Wash} from '../../../components/Effects';
import {blink, easeIn, easeInOut, easeOut, shake, tween, wobble} from '../../../lib/anim';
import {Character, HandPhone} from '../../rig/Character';
import {MILO, NORA, THEO} from '../../cast';
import {Entry, ENTRY, stairY} from '../../locations/Entry';
import {Attic} from '../../locations/Attic';
import {Town} from '../../locations/Town';
import {Yard} from '../../locations/Yard';
import {Polaroid} from '../../props/Polaroid';
import {SignalPhone} from '../../props/SignalPhone';
import {HamRadio} from '../../props/HamRadio';
import {Glow, SeriesDefs} from '../../ui/Glow';
import {ChapterTitle, Countdown, SeriesSubtitles, Timeline} from '../../ui/SeriesUI';
import {FinaleEnding} from '../../ui/FinaleEnding';
import {makeSpeak} from '../../ui/Shots';
import {T} from '../../theme';

/**
 * THE LAST SIGNAL: Chapter 4 (SERIES FINALE), "The Person Closest to You"
 * Follows the Ch.3 winner: 1, CLOSE THE DOOR.
 *
 * Payoffs: the radio voice sounds like Nora (Ch.1) → it IS her Echo. Echoes don't appear on screens/mirrors (Ch.3 mirror)
 * → the girl in the photo (Ch.3) vanishes on Theo's camera. "Don't trust whoever is with you" (Ch.2) → the radio, which
 * was in the attic with her. Echoes need an invitation (Ch.3) → Theo invites his Echo in, and the two Echoes return
 * to the light. The town's lights come back (reverse of Ch.1). Dad's last signal.
 */
const TL = timelineJson as Timeline;
export const CH04_DURATION = TL.durationInFrames;
const speak = makeSpeak(TL);
const L = (id: string) => TL.lines.find((l) => l.id === id)!;

// Ch.3 ended at ~183 s after 11:47:00 PM (countdown 23:56:57). Ch.4 picks up that same second.
const ELAPSED_AT_START = 183;

const S = {
  slam: [0, 76],
  radio: [76, 206],
  camera: [206, 292],
  screen: [292, 462],
  noraReal: [462, 526],
  theoTruth: [526, 642],
  meaning: [642, 772],
  warnings: [772, 932],
  outside: [932, 1026],
  manifest: [1026, 1106],
  invite: [1106, 1150],
  crossing: [1150, 1216],
  together: [1216, 1350],
  restore: [1350, 1478],
  dad: [1478, 1716],
  dawn: [1716, 1940],
  end: [1940, CH04_DURATION],
} as const;

const D = ENTRY.door;
const DOOR_C = {x: D.x + D.w / 2, y: D.y + D.h};
const NORA_HALL = {x: 930, y: 1590, scale: 1.05};
const THEO_STAIR = {x: 470, y: stairY(470), scale: 1.0};
const MILO_STAIR = {x: 690, y: stairY(690), scale: 1.0};
const NORA_DESK = {x: 1180, y: 1560, scale: 1.05};

type Cam = {x: number; y: number; zoom: number; rotate?: number};

/** ghostly Echo look: pale, glowing (red while tied to the radio, white when returning to the light) */
const ghost = (color: 'red' | 'white', amount = 1) =>
  color === 'red'
    ? `grayscale(0.7) brightness(${1 + 0.35 * amount}) drop-shadow(0 0 ${18 * amount}px rgba(255,51,72,0.9))`
    : `grayscale(0.8) brightness(${1 + 0.6 * amount}) drop-shadow(0 0 ${26 * amount}px rgba(233,244,255,1))`;

const Hall: React.FC<{g: number; cam: Cam; doorOpen?: number; echo?: React.ReactNode; barrier?: number; lightning?: number; red?: number; dim?: number; children?: React.ReactNode}> = ({
  g,
  cam,
  doorOpen = 0,
  echo,
  barrier = 0,
  lightning = 0,
  red = 0,
  dim = 0.28,
  children,
}) => (
  <Stage bg="#06060c">
    <SeriesDefs />
    <Camera x={cam.x} y={cam.y} zoom={cam.zoom} rotate={cam.rotate ?? 0}>
      <Entry frame={g} doorOpen={doorOpen} outside={echo} dryAround={echo ? {x: DOOR_C.x, y: DOOR_C.y - 300, r: 280} : null} barrier={barrier} lightning={lightning} redFromUpstairs={red} />
      <rect x={-600} y={-400} width={3200} height={2600} fill="#020208" opacity={dim} />
      {children}
    </Camera>
  </Stage>
);

const noraP = (g: number) => ({who: NORA, ...NORA_HALL, frame: g});
const theoP = (g: number) => ({who: THEO, frame: g, wet: true});
const photoInHand = <rect x={-28} y={-40} width={56} height={66} rx={3} fill="#efeadf" stroke="#d6cfbf" strokeWidth={3} />;

/* ================================================================ scenes */

/** HOOK 0–2.5s: SLAM. Lightning. A palm hits the door's window from outside, leaving a frost print. */
const SceneSlam: React.FC = () => {
  const f = useCurrentFrame();
  const g = f;
  const shut = tween(f, [4, 10], [1, 0], easeIn);
  const lightning = tween(f, [9, 11], [0, 1]) * tween(f, [11, 22], [1, 0]);
  const palm = f >= 26;
  const frost = tween(f, [26, 40], [0, 1]);
  const jolt = shake(f, 10, 22, 7) + shake(f, 26, 12, 6);
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: tween(f, [0, 76], [1180, 1250]) + jolt, y: tween(f, [0, 76], [1080, 860]), zoom: tween(f, [0, 76], [1.25, 2.3], easeInOut), rotate: tween(f, [0, 76], [0, -3])}} doorOpen={shut} lightning={lightning}>
        {/* the door's window: the Echo's silhouette and his palm print */}
        {shut < 0.05 ? (
          <g>
            <clipPath id="doorWinClip">
              <rect x={D.x + 40} y={D.y + 60} width={D.w - 80} height={180} rx={10} />
            </clipPath>
            <rect x={D.x + 40} y={D.y + 60} width={D.w - 80} height={180} rx={10} fill="#0b1226" />
            <g clipPath="url(#doorWinClip)">
              <Character who={THEO} x={DOOR_C.x} y={D.y + 760} scale={1} frame={g} dark={0.9} />
            </g>
            <rect x={D.x + 40} y={D.y + 60} width={D.w - 80} height={180} rx={10} fill="#9bb7ff" opacity={0.08} />
            {palm ? (
              <g transform={`translate(${DOOR_C.x - 20} ${D.y + 150})`} opacity={0.6 + 0.4 * frost}>
                <ellipse cx={0} cy={0} rx={30} ry={36} fill="#dfefff" opacity={0.7} />
                {[-26, -9, 8, 24].map((dx, i) => (
                  <rect key={i} x={dx - 6} y={-78 + Math.abs(i - 1.5) * 8} width={13} height={46} rx={6} fill="#dfefff" opacity={0.7} />
                ))}
                <rect x={30} y={-20} width={12} height={34} rx={6} fill="#dfefff" opacity={0.7} transform="rotate(30 36 -3)" />
              </g>
            ) : null}
          </g>
        ) : null}
        <Character {...noraP(g)} x={NORA_HALL.x + 120} headTurn={-0.3} lookX={0.6} eyeOpen={tween(f, [10, 16], [1.1, 1.45])} brow={1} mouth="gasp" mouthOpen={0.5} armL={{shoulder: -100, elbow: -30}} armR={{shoulder: -110, elbow: -40}} hold={{side: 'R', item: photoInHand}} lean={-10} shiver={0.5} />
      </Hall>
      <Flash opacity={lightning * 0.4} color="#e6eeff" />
      <Vignette strength={0.92} />
    </AbsoluteFill>
  );
};

/** 2.5–6.9s: red light floods down the stairs. "Good. Now bring me the photo. Come to the tower. Alone." */
const SceneRadio: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.radio[0];
  const red = tween(g, [72, 84], [0, 1]) * (0.8 + 0.2 * Math.sin(g * 0.5));
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: tween(f, [0, 130], [760, 700]), y: tween(f, [0, 130], [1060, 1120]), zoom: tween(f, [0, 130], [1.15, 1.35], easeInOut), rotate: 3}} red={red}>
        <Character who={MILO} {...MILO_STAIR} frame={g} headTurn={-0.5} lookX={-1} lookY={-0.6} eyeOpen={1.2} brow={0.9} mouth="o" mouthOpen={0.3} armL={{shoulder: -20, elbow: -20}} armR={{shoulder: 20, elbow: 20}} />
        <Character {...theoP(g)} {...THEO_STAIR} headTurn={-0.4} lookX={-0.8} lookY={-0.8} eyeOpen={1.25} brow={1} mouth="frown" armL={{shoulder: -10, elbow: -10}} armR={{shoulder: 10, elbow: 10}} />
        <Character {...noraP(g)} headTurn={-0.6} lookX={-0.9} lookY={-0.9} eyeOpen={1.2 * blink(g, 33)} brow={0.6} mouth="closed" armL={{shoulder: -30, elbow: -100}} armR={{shoulder: 30, elbow: 110}} hold={{side: 'R', item: photoInHand}} />
      </Hall>
      <Wash opacity={0.22 * red} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 6.9–9.7s: Theo hurries down and raises his phone camera at the photo */
const SceneCamera: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.camera[0];
  const tx = tween(f, [0, 30], [THEO_STAIR.x + 120, NORA_HALL.x - 230], easeOut);
  const ty = tween(f, [0, 30], [stairY(THEO_STAIR.x + 120), 1590], easeOut);
  const raise = tween(f, [32, 50], [0, 1], easeOut);
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: 820, y: 1080, zoom: tween(f, [0, 86], [1.5, 1.85], easeInOut), rotate: -2}} red={0.35}>
        <Character {...theoP(g)} x={tx} y={ty} scale={1} walk={f < 30 ? f * 0.45 : undefined} headTurn={0.55} lookX={0.9} lookY={0.4} eyeOpen={1.15 * blink(g, 6)} brow={0.9} mouth={speak(g, 't1') > 0 ? 'talk' : 'frown'} mouthOpen={speak(g, 't1')} armL={{shoulder: -10, elbow: -10}} armR={{shoulder: tween(raise, [0, 1], [-5, -70]), elbow: tween(raise, [0, 1], [5, -60])}} hold={{side: 'R', item: <HandPhone glow={raise} />}} />
        <Character {...noraP(g)} headTurn={-0.55} lookX={-0.8} lookY={0.4} eyeOpen={1.1 * blink(g, 22)} brow={0.7} mouth="closed" armL={{shoulder: -30, elbow: -100}} armR={{shoulder: 30, elbow: 110}} hold={{side: 'R', item: photoInHand}} />
        <Glow x={tx + 40} y={ty - 560} r={140} color="phone" opacity={0.6 * raise} />
      </Hall>
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 9.7–15.4s: through Theo's camera, the girl in the photo is GONE (Echoes never show up on screens) */
const SceneScreen: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.screen[0];
  const shake2 = Math.sin(g * 0.9) * 2;
  const z = tween(f, [0, 170], [1.0, 1.25], easeInOut);
  const reveal = tween(g, [372, 386], [0, 1]);
  return (
    <AbsoluteFill>
      <Stage bg="#0c0b10">
        <SeriesDefs />
        <defs>
          <clipPath id="camScreen">
            <rect x={-250} y={-430} width={500} height={860} rx={50} />
          </clipPath>
        </defs>
        <g transform={`translate(540 860) scale(${z}) translate(-540 -860)`}>
          {/* the real photo, held by Nora (blurred background) */}
          <g transform="translate(540 820) rotate(-6) scale(1.55) translate(-260 -310)" style={{filter: 'blur(5px)'}} opacity={0.75}>
            <Polaroid frame={g} glow={1} />
          </g>
          {/* Theo's phone in front, camera viewfinder */}
          <g transform={`translate(${560 + shake2} ${840}) rotate(4)`}>
            <rect x={-272} y={-452} width={544} height={904} rx={66} fill="#0b0c12" stroke="#3b4058" strokeWidth={6} />
            <g clipPath="url(#camScreen)">
              <rect x={-250} y={-430} width={500} height={860} fill="#05060a" />
              <g transform="translate(0 -40) rotate(-10) scale(1.35) translate(-260 -310)">
                <Polaroid frame={g} glow={1} hideNora />
              </g>
              {/* camera UI */}
              <rect x={-250} y={-430} width={500} height={70} fill="#000" opacity={0.5} />
              <circle cx={0} cy={360} r={44} fill="none" stroke="#fff" strokeWidth={8} />
              <circle cx={0} cy={360} r={34} fill="#fff" opacity={g < 300 ? 0.6 : 0.9} />
              <text x={0} y={-386} fill="#ffd84d" fontFamily={T.font} fontWeight={800} fontSize={26} textAnchor="middle">
                PHOTO
              </text>
              {/* focus box on where the girl SHOULD be */}
              <g opacity={reveal} transform="translate(-170 40)">
                <rect x={-70} y={-120} width={140} height={200} fill="none" stroke={T.uiRed} strokeWidth={6} strokeDasharray="22 14" />
                <text x={0} y={120} fill={T.uiRed} fontFamily={T.font} fontWeight={900} fontSize={30} textAnchor="middle">
                  NO ONE
                </text>
              </g>
              {g >= 292 && g < 297 ? <rect x={-250} y={-430} width={500} height={860} fill="#fff" opacity={0.8} /> : null}
            </g>
          </g>
          <ellipse cx={830} cy={1290} rx={80} ry={120} fill={THEO.palette.skin} transform="rotate(-25 830 1290)" />
        </g>
      </Stage>
      <Wash opacity={0.2 * reveal} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};

/** 15.4–17.5s: "I was never at the tower. SHE was." */
const SceneNoraReal: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.noraReal[0];
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: NORA_HALL.x - 10, y: 950, zoom: tween(f, [0, 64], [2.5, 2.9], easeIn), rotate: 3}} red={0.3}>
        <Character {...noraP(g)} headTurn={0.1} headTilt={-4} lookX={0} lookY={-0.2} eyeOpen={1.35} brow={1} mouth={speak(g, 'no1') > 0 ? 'talk' : 'frown'} mouthOpen={speak(g, 'no1')} armL={{shoulder: -30, elbow: -100}} armR={{shoulder: 30, elbow: 110}} hold={{side: 'R', item: photoInHand}} shiver={0.4} />
      </Hall>
      <Vignette strength={0.94} />
    </AbsoluteFill>
  );
};

/** 17.5–21.4s: Theo: "The radio sounds like you… because it IS you." */
const SceneTheoTruth: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.theoTruth[0];
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: NORA_HALL.x - 220, y: 990, zoom: tween(f, [0, 116], [2.2, 2.6], easeInOut), rotate: -2}} red={tween(f, [40, 100], [0.2, 0.8])}>
        <Character {...theoP(g)} x={NORA_HALL.x - 230} y={1590} headTurn={0.5} lookX={0.9} eyeOpen={1.2 * blink(g, 17)} brow={1} mouth={speak(g, 't2') > 0 ? 'talk' : 'frown'} mouthOpen={speak(g, 't2')} armL={{shoulder: -10, elbow: -10}} armR={{shoulder: -40, elbow: -60}} hold={{side: 'R', item: <HandPhone glow={0.7} />}} />
      </Hall>
      <Wash opacity={tween(f, [40, 100], [0.05, 0.22])} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.94} />
    </AbsoluteFill>
  );
};

/** 21.4–25.7s: the message's true meaning. In the black glass of the phone: Nora's own face. */
const SceneMeaning: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.meaning[0];
  const screenOff = tween(g, [728, 740], [1, 0]);
  const face = tween(g, [732, 750], [0, 1]);
  return (
    <AbsoluteFill>
      <Stage bg="#04050a">
        <SeriesDefs />
        <g transform={`translate(540 960) scale(${tween(f, [0, 130], [1.0, 1.2], easeInOut)}) translate(-540 -960)`}>
          <SignalPhone frame={g} x={540} y={880} scale={1.1} mode="lock" notifAt={S.meaning[0] - 40} id="meaning" screenOn={screenOff} glitch={g > 700 && g < 730 ? 0.6 : 0} />
          {/* reflection in the dark screen */}
          <g opacity={face * 0.55} style={{mixBlendMode: 'screen'}}>
            <Character who={NORA} x={540} y={1560} scale={1.35} frame={g} eyeOpen={1.2} brow={0.9} mouth="frown" cssFilter="grayscale(1) brightness(0.9)" />
          </g>
        </g>
        {/* highlight the key line */}
        <rect x={150} y={tween(g, [655, 670], [1100, 905])} width={780} height={0} fill="none" />
      </Stage>
      <Vignette strength={0.88} />
    </AbsoluteFill>
  );
};

/** 25.7–31.1s: "Every warning came from him… 'Don't trust whoever is with you.' He meant the radio." */
const SceneWarnings: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.warnings[0];
  if (g < 840) {
    return (
      <AbsoluteFill>
        <Hall g={g} cam={{x: NORA_HALL.x - 220, y: 990, zoom: tween(f, [0, 68], [2.3, 2.5]), rotate: 2}} red={0.6}>
          <Character {...theoP(g)} x={NORA_HALL.x - 230} y={1590} headTurn={0.35} lookX={0.4} lookY={0.2} eyeOpen={blink(g, 3)} brow={1} mouth={speak(g, 't3') > 0 ? 'talk' : 'frown'} mouthOpen={speak(g, 't3')} armL={{shoulder: -10, elbow: -10}} armR={{shoulder: 10, elbow: 10}} />
        </Hall>
        <Vignette strength={0.94} />
      </AbsoluteFill>
    );
  }
  if (g < 888) {
    return (
      <AbsoluteFill style={{filter: 'grayscale(0.4)'}}>
        <Stage bg="#04050a">
          <SeriesDefs />
          <g transform={`translate(540 960) scale(${tween(g, [840, 888], [1.0, 1.15])}) translate(-540 -960)`}>
            <SignalPhone frame={g} x={540} y={880} scale={1.1} mode="lock" id="w2" lockTime="11:48" notifAt={830} notif={{title: 'THEO', sub: 'Chapter 2 · 11:48 PM', icon: 'contact', firstLineRed: false, lines: ["NORA, IT'S ME.", "I'M OUTSIDE.", "DON'T TRUST", 'WHOEVER IS', 'WITH YOU.']}} />
            <rect x={300} y={1000} width={520} height={150} rx={20} fill="none" stroke={T.uiRed} strokeWidth={8} opacity={tween(g, [852, 860], [0, 1])} />
          </g>
        </Stage>
        <Grain frame={g} opacity={0.15} />
        <Vignette strength={0.88} />
      </AbsoluteFill>
    );
  }
  // the radio was "with" her in the attic the whole time
  return (
    <AbsoluteFill>
      <Stage bg="#06060c">
        <SeriesDefs />
        <Glow x={540} y={900} r={900} color="red" opacity={0.45} />
        <g transform={`translate(${540 + shake(g, 888, 6, 12)} 900) scale(${tween(g, [888, 932], [2.2, 2.6])}) rotate(-3) translate(-180 -110)`}>
          <HamRadio frame={g} power={1} danger={1} wave={0.5 + 0.3 * Math.sin(g * 0.5)} />
        </g>
      </Stage>
      <Wash opacity={0.22} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 31.1–34.2s: outside, alone in the rain, the boy they shut out (seen from the attic window) */
const SceneOutside: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.outside[0];
  return (
    <AbsoluteFill>
      <Stage bg="#050710">
        <SeriesDefs />
        <g transform={`translate(540 960) scale(${tween(f, [0, 94], [1.25, 1.7], easeInOut)}) translate(-540 ${-tween(f, [0, 94], [1150, 1200])})`}>
          <Yard
            frame={g}
            figure={
              <g>
                <ellipse cx={540} cy={1606} rx={100} ry={22} fill="#000" opacity={0.4} />
                <Character who={THEO} x={540} y={1600} scale={0.95} frame={g} headTilt={10} lookY={0.9} eyeOpen={0.8} brow={0.8} mouth="frown" armL={{shoulder: 4, elbow: -4}} armR={{shoulder: -4, elbow: 4}} dark={0.25} />
              </g>
            }
            dryAround={{x: 540, y: 1600 - 285, r: 270}}
          />
        </g>
        <rect x={0} y={0} width={1080} height={1920} fill="none" stroke="#1a1626" strokeWidth={70} />
      </Stage>
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** red static on the landing that forms into Nora's Echo */
const EchoNora: React.FC<{g: number; x: number; y: number; form: number; color?: 'red' | 'white'; talk?: number; walk?: number; opacity?: number; armL?: {shoulder: number; elbow: number}; armR?: {shoulder: number; elbow: number}; headTurn?: number}> = ({
  g,
  x,
  y,
  form,
  color = 'red',
  talk = 0,
  walk,
  opacity = 1,
  armL,
  armR,
  headTurn = 0.4,
}) => (
  <g>
    {/* static particles converging */}
    {[...Array(26)].map((_, i) => {
      const a = i * 2.4 + g * 0.05;
      const r = (1 - form) * 380 + 60;
      return <circle key={i} cx={x + Math.cos(a) * r} cy={y - 360 + Math.sin(a) * r * 1.4} r={4 + (i % 3) * 2} fill={color === 'red' ? T.signalRed : T.signalWhite} opacity={(1 - form * 0.7) * 0.8 * opacity} />;
    })}
    <Character
      who={NORA}
      x={x}
      y={y}
      scale={1.05}
      frame={g}
      walk={walk}
      headTurn={headTurn}
      lookX={0.8}
      eyeOpen={1}
      brow={-0.5}
      mouth={talk > 0 ? 'talk' : 'closed'}
      mouthOpen={talk}
      armL={armL}
      armR={armR}
      cssFilter={ghost(color, 1)}
      opacity={form * opacity}
    />
  </g>
);

/** 34.2–36.9s: "If you won't come to me… I'll come to you." Nora's Echo forms on the stairs */
const SceneManifest: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.manifest[0];
  const form = tween(g, [1018, 1050], [0, 1], easeOut);
  const ex = tween(g, [1050, 1106], [700, 500], easeInOut);
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: tween(f, [0, 80], [680, 720]), y: tween(f, [0, 80], [860, 1000], easeInOut), zoom: tween(f, [0, 80], [1.0, 1.15], easeInOut), rotate: 4 + shake(g, 1030, 2, 20)}} red={1} dim={0.35}>
        <EchoNora g={g} x={ex} y={stairY(ex)} form={form} talk={speak(g, 'ne1')} walk={g > 1050 ? g * 0.25 : undefined} />
        <Character who={MILO} x={tween(g, [1030, 1060], [MILO_STAIR.x - 140, 860], easeOut)} y={tween(g, [1030, 1060], [stairY(MILO_STAIR.x - 140), 1600], easeOut)} frame={g} walk={g > 1030 && g < 1060 ? g * 0.5 : undefined} headTurn={-0.6} lookX={-1} eyeOpen={1.35} brow={1} mouth="gasp" mouthOpen={0.5} />
        <Character {...noraP(g)} x={NORA_HALL.x + 120} headTurn={-0.6} lookX={-1} lookY={-0.4} eyeOpen={1.4} brow={1} mouth="gasp" mouthOpen={0.6} armL={{shoulder: -20, elbow: -30}} armR={{shoulder: -60, elbow: -40}} lean={-6} />
        <Character {...theoP(g)} x={NORA_HALL.x - 60} y={1600} headTurn={-0.5} lookX={-1} lookY={-0.4} eyeOpen={1.4} brow={1} mouth="grimace" armL={{shoulder: 60, elbow: 30}} armR={{shoulder: 10, elbow: 10}} />
        <Glow x={ex} y={stairY(ex) - 380} r={420} color="red" opacity={0.6 * form} />
      </Hall>
      <Wash opacity={0.3} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 36.9–38.3s: Theo flings the door open: "THEO! COME IN!" */
const SceneInvite: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.invite[0];
  const open = tween(g, [1108, 1116], [0, 1], easeOut);
  const lightning = tween(g, [1119, 1121], [0, 1]) * tween(g, [1121, 1132], [1, 0]);
  return (
    <AbsoluteFill>
      <Hall
        g={g}
        cam={{x: 1180 + shake(g, 1108, 14, 6), y: 1060, zoom: 1.45, rotate: -3}}
        doorOpen={open}
        lightning={lightning}
        barrier={0.5}
        red={0.6}
        echo={<Character who={THEO} x={DOOR_C.x} y={DOOR_C.y} scale={1} frame={g} headTurn={-0.2} lookX={-0.6} eyeOpen={1.2} brow={0.5} mouth="o" mouthOpen={0.3} dark={0.3} />}
      >
        <Character {...theoP(g)} x={D.x - 110} y={1600} headTurn={0.8} lookX={1} eyeOpen={1.3} brow={0.6} mouth={speak(g, 't4') > 0 ? 'talk' : 'gasp'} mouthOpen={Math.max(0.5, speak(g, 't4'))} armL={{shoulder: -10, elbow: -10}} armR={{shoulder: -95, elbow: -10}} lean={8} />
      </Hall>
      <Flash opacity={lightning * 0.35} color="#e6eeff" />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 38.3–40.5s: "One invitation. That's all he ever needed." The wall breaks; the Echo steps inside. */
const SceneCrossing: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.crossing[0];
  const burst = tween(g, [1156, 1160], [0, 1]) * tween(g, [1160, 1180], [1, 0]);
  const k = tween(g, [1160, 1216], [0, 1], easeInOut);
  const inside = g >= 1160;
  return (
    <AbsoluteFill>
      <Hall
        g={g}
        cam={{x: tween(f, [0, 66], [1150, 900]), y: 1080, zoom: tween(f, [0, 66], [1.4, 1.2]), rotate: -2}}
        doorOpen={1}
        barrier={inside ? 0 : 0.6}
        red={0.6}
        echo={!inside ? <Character who={THEO} x={DOOR_C.x} y={DOOR_C.y} scale={1} frame={g} headTurn={-0.2} lookX={-0.8} eyeOpen={1.05} brow={-0.2} mouth="closed" dark={0.3} /> : null}
      >
        {inside ? (
          <Character who={THEO} x={tween(k, [0, 1], [DOOR_C.x - 40, 720])} y={tween(k, [0, 1], [DOOR_C.y + 20, 1600])} scale={1} frame={g} walk={g * 0.32} headTurn={-0.6} lookX={-1} eyeOpen={1} brow={-0.2} mouth="closed" cssFilter={ghost('white', 0.3 + 0.5 * k)} />
        ) : null}
        <Character {...theoP(g)} x={D.x - 140} y={1600} headTurn={0.3} lookX={0.4} eyeOpen={1.2} brow={0.8} mouth="frown" armL={{shoulder: -10, elbow: -10}} armR={{shoulder: -20, elbow: -20}} />
        <EchoNora g={g} x={500} y={stairY(500)} form={1} armL={{shoulder: 10, elbow: 10}} armR={{shoulder: -10, elbow: -10}} headTurn={0.6} />
        <Glow x={DOOR_C.x} y={DOOR_C.y - 450} r={500} color="white" opacity={burst} />
      </Hall>
      <Flash opacity={burst * 0.5} color="#eef6ff" />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 40.5–45s: the two Echoes, hand in hand: "We came out of the light together. We go back together." / "Take care of her." */
const SceneTogether: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.together[0];
  const toTheo = g >= 1300; // "Take care of her." turned to the real Theo
  const glow = tween(g, [1216, 1330], [0.4, 1.6]);
  const dissolve = tween(g, [1334, 1350], [0, 1]);
  const camX = toTheo ? tween(g, [1300, 1350], [700, 860], easeInOut) : tween(g, [1216, 1300], [560, 620], easeInOut);
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: camX, y: tween(g, [1216, 1350], [1060, 1000]), zoom: toTheo ? 1.6 : tween(g, [1216, 1300], [1.55, 1.9], easeInOut), rotate: 2}} doorOpen={1} red={tween(g, [1216, 1300], [0.6, 0])} dim={0.28}>
        {/* hand in hand at the foot of the stairs */}
        <EchoNora g={g} x={480} y={1560} form={1} color={g > 1250 ? 'white' : 'red'} opacity={1 - dissolve} armR={{shoulder: -60, elbow: -20}} armL={{shoulder: 10, elbow: 10}} headTurn={0.5} />
        <Character
          who={THEO}
          x={640}
          y={1580}
          scale={1}
          frame={g}
          headTurn={toTheo ? 0.8 : -0.6}
          lookX={toTheo ? 1 : -1}
          eyeOpen={1 * blink(g, 8)}
          brow={0.5}
          mouth={speak(g, 'x1') > 0 || speak(g, 'x2') > 0 ? 'talk' : 'smile'}
          mouthOpen={Math.max(speak(g, 'x1'), speak(g, 'x2'))}
          armL={{shoulder: 60, elbow: 20}}
          armR={{shoulder: -10, elbow: 10}}
          cssFilter={ghost('white', glow)}
          opacity={1 - dissolve}
        />
        {/* the real Theo and Nora watch; Milo holds on to Nora */}
        {toTheo ? (
          <g>
            <Character who={MILO} x={1120} y={1620} frame={g} headTurn={-0.5} lookX={-1} eyeOpen={1.2} brow={0.8} mouth="o" mouthOpen={0.2} />
            <Character {...theoP(g)} x={980} y={1600} headTurn={-0.6} lookX={-1} eyeOpen={0.95} brow={1} mouth="frown" armL={{shoulder: -10, elbow: -10}} armR={{shoulder: 10, elbow: 10}} headTilt={tween(g, [1325, 1335], [0, 8])} />
          </g>
        ) : null}
        {/* rising light particles as they dissolve */}
        {[...Array(40)].map((_, i) => {
          const t = ((g - 1300) * 0.02 + i * 0.07) % 1;
          return g > 1300 ? <circle key={i} cx={420 + ((i * 37) % 300) + Math.sin(g * 0.1 + i) * 20} cy={1500 - t * 900} r={3 + (i % 3) * 2} fill="#eef6ff" opacity={(1 - t) * 0.8 * (0.3 + glow * 0.4)} style={{mixBlendMode: 'screen'}} /> : null;
        })}
        <Glow x={560} y={1200} r={520} color="white" opacity={0.25 * glow} />
      </Hall>
      <Flash opacity={dissolve * 0.85} color="#ffffff" />
      <Vignette strength={0.88} />
    </AbsoluteFill>
  );
};

/** 45–49.3s: the tower goes dark, and every light in Harlow Point comes back on (reverse of Ch.1) */
const SceneRestore: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.restore[0];
  return (
    <AbsoluteFill>
      <Stage bg={T.sky0}>
        <SeriesDefs />
        <Town
          frame={g}
          zoom={tween(f, [0, 128], [1.35, 1.0], easeInOut)}
          focusX={760}
          focusY={900}
          camX={tween(f, [0, 128], [120, 20])}
          phonesOnAt={-100}
          blackoutAt={-100}
          towerWhiteAt={-100}
          towerOffAt={1378}
          restoreAt={1396}
          restoreSpread={38}
          atticLight={tween(g, [1420, 1426], [0, 1])}
          stationLit={1}
        />
      </Stage>
      <Flash opacity={tween(g, [1350, 1356], [0.9, 0])} color="#ffffff" />
      <Vignette strength={0.8} />
    </AbsoluteFill>
  );
};

/** 49.3–57.2s: back in the attic, Dad's radio speaks one last time. Then silence. */
const SceneDad: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.dad[0];
  const wave = speak(g, 'd1');
  const power = tween(g, [1680, 1705], [1, 0]);
  const tear = (g * 1.4) % 60;
  return (
    <AbsoluteFill>
      <Stage bg="#06060c">
        <SeriesDefs />
        <Camera x={tween(f, [0, 238], [1360, 1250], easeInOut)} y={tween(f, [0, 238], [1010, 1080])} zoom={tween(f, [0, 150, 238], [2.0, 2.3, 1.6], easeInOut)}>
          <Attic frame={g} power={1} radioPower={power} radioWave={wave} towerWhite={false} />
          <Character who={MILO} x={NORA_DESK.x - 210} y={NORA_DESK.y + 30} frame={g} headTurn={0.6} lookX={1} lookY={0.2} eyeOpen={blink(g, 12) * 0.95} brow={0.8} mouth="frown" armL={{shoulder: -10, elbow: -10}} armR={{shoulder: -60, elbow: -40}} />
          <Character
            who={NORA}
            {...NORA_DESK}
            frame={g}
            headTurn={0.7}
            headTilt={6}
            lookX={1}
            lookY={0.3}
            eyeOpen={0.9 * blink(g, 40, 130)}
            brow={1}
            mouth="frown"
            armL={{shoulder: -30, elbow: -100}}
            armR={{shoulder: -70, elbow: -50}}
          />
          {/* tears */}
          {[0, 1].map((i) => (
            <ellipse key={i} cx={NORA_DESK.x + 60 + i * 30} cy={NORA_DESK.y - 600 + ((tear + i * 30) % 60) * 2.2} rx={4} ry={8} fill="#bfe0ff" opacity={0.8 * (1 - ((tear + i * 30) % 60) / 60)} />
          ))}
          <Glow x={1600} y={1060} r={460} color="amber" opacity={0.65 * power} />
        </Camera>
      </Stage>
      <Wash opacity={0.12 * power} color={T.amber} blend="overlay" />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 57.2–64.7s: dawn. Rain over. Nora and Theo on the roof: "No more secrets." */
const SceneDawn: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.dawn[0];
  const lean = tween(g, [1800, 1830], [0, 1], easeInOut);
  return (
    <AbsoluteFill>
      <Stage bg={T.sky0}>
        <SeriesDefs />
        <g transform={`translate(0 ${tween(f, [0, 224], [-60, 40], easeInOut)})`}>
          <Town frame={g} zoom={tween(f, [0, 224], [1.15, 1.0], easeInOut)} focusX={540} focusY={900} camX={0} phonesOnAt={-100} blackoutAt={-100} towerWhiteAt={-100} towerOffAt={-50} restoreAt={-100} dawn={tween(f, [0, 60], [0.6, 1])} atticLight={0.6} stationLit={0.5} />
        </g>
        {/* foreground: the Vance roof */}
        <g transform={`translate(540 1960) scale(${tween(f, [0, 224], [1.15, 1.0], easeInOut)}) translate(-540 -1960)`}>
          <Character who={THEO} x={640} y={1840} pose="sit" scale={1.5} frame={g} headTurn={-0.3} lookX={-0.4} lookY={0.1} eyeOpen={blink(g, 21) * 0.95} brow={0.3} mouth={speak(g, 't5') > 0 ? 'talk' : 'smile'} mouthOpen={speak(g, 't5')} armL={{shoulder: tween(lean, [0, 1], [10, 60]), elbow: tween(lean, [0, 1], [10, 50])}} armR={{shoulder: -10, elbow: -10}} />
          <Character who={NORA} x={400} y={1855} pose="sit" scale={1.5} frame={g} headTurn={0.35} headTilt={tween(lean, [0, 1], [0, 16])} lookX={0.5} lookY={0.1} eyeOpen={blink(g, 7) * 0.9} brow={0.2} mouth={speak(g, 'no2') > 0 ? 'talk' : 'smile'} mouthOpen={speak(g, 'no2')} armL={{shoulder: 10, elbow: 10}} armR={{shoulder: -10, elbow: -10}} />
          <path d="M -200 1470 L 1280 1440 L 1280 2200 L -200 2200 Z" fill="#1c1f36" />
          <path d="M -200 1470 L 1280 1440" stroke="#3a3f60" strokeWidth={14} />
          {[...Array(10)].map((_, i) => (
            <path key={i} d={`M ${-200 + i * 160} ${1470 - i * 3} L ${-260 + i * 170} 2200`} stroke="#15182a" strokeWidth={6} />
          ))}
          <Glow x={300} y={1100} r={700} color="warm" opacity={0.25} />
        </g>
        {/* birds */}
        {[0, 1, 2].map((i) => {
          const bx = ((g * (1.6 + i * 0.3) + i * 300) % 1400) - 200;
          const by = 520 + i * 60 + Math.sin(g * 0.1 + i) * 10;
          const w = Math.sin(g * 0.5 + i) * 8;
          return <path key={i} d={`M ${bx - 16} ${by - w} Q ${bx - 8} ${by - 6} ${bx} ${by} Q ${bx + 8} ${by - 6} ${bx + 16} ${by - w}`} stroke="#2a2440" strokeWidth={4} fill="none" />;
        })}
      </Stage>
      <Wash opacity={0.12} color="#ffb070" blend="soft-light" />
      <Vignette strength={0.6} color="30,10,0" />
    </AbsoluteFill>
  );
};

/** 64.7–76.8s: end screen background (dawn town, slowly fading) */
const SceneEndBg: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.end[0];
  return (
    <AbsoluteFill>
      <Stage bg={T.sky0}>
        <SeriesDefs />
        <Town frame={g} zoom={1.0 + f * 0.0004} focusX={540} focusY={900} camX={0} phonesOnAt={-100} blackoutAt={-100} towerWhiteAt={-100} towerOffAt={-50} restoreAt={-100} dawn={1} atticLight={0.6} stationLit={0.5} />
      </Stage>
    </AbsoluteFill>
  );
};

/* ================================================================ chapter */
const SCENES: [readonly [number, number], React.FC][] = [
  [S.slam, SceneSlam],
  [S.radio, SceneRadio],
  [S.camera, SceneCamera],
  [S.screen, SceneScreen],
  [S.noraReal, SceneNoraReal],
  [S.theoTruth, SceneTheoTruth],
  [S.meaning, SceneMeaning],
  [S.warnings, SceneWarnings],
  [S.outside, SceneOutside],
  [S.manifest, SceneManifest],
  [S.invite, SceneInvite],
  [S.crossing, SceneCrossing],
  [S.together, SceneTogether],
  [S.restore, SceneRestore],
  [S.dad, SceneDad],
  [S.dawn, SceneDawn],
  [S.end, SceneEndBg],
];

/** the countdown glitches and dies when the Fold collapses; a brief "SIGNAL LOST" replaces it */
const SignalLost: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 1382 || frame > 1470) return null;
  const o = tween(frame, [1382, 1390], [0, 1]) * tween(frame, [1455, 1470], [1, 0]);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: o}}>
      <div style={{position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', background: 'rgba(5,6,12,0.72)', border: '3px solid #8b93b5', borderRadius: 18, padding: '12px 26px', fontFamily: T.mono, fontWeight: 700, fontSize: 44, color: '#c9cfe6', letterSpacing: 4}}>
        SIGNAL LOST
      </div>
    </AbsoluteFill>
  );
};

export const Chapter04: React.FC = () => {
  const frame = useCurrentFrame();
  const glitch = frame > 1340 && frame < 1382;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SCENES.map(([[from, to], C], i) => (
        <Sequence key={i} from={from} durationInFrames={to - from}>
          <C />
        </Sequence>
      ))}
      <Flash opacity={tween(frame, [1712, 1716], [0, 1]) * tween(frame, [1716, 1730], [1, 0])} color="#000" />
      <Grain frame={frame} opacity={0.07} />
      <ChapterTitle at={80} chapter={4} title="THE PERSON CLOSEST TO YOU" hold={64} />
      {frame < 1382 ? (
        <div style={{position: 'absolute', inset: 0, transform: glitch ? `translateX(${Math.sin(frame * 7) * 10}px)` : undefined, opacity: glitch ? 0.5 + 0.5 * Math.sin(frame * 3) : 1}}>
          <Countdown zeroFrame={0} elapsedAtZero={ELAPSED_AT_START} show={frame >= 30 ? 1 : 0} urgent={frame >= S.manifest[0]} />
        </div>
      ) : null}
      <SignalLost />
      <SeriesSubtitles timeline={TL} />
      <FinaleEnding at={S.end[0]} phase2At={L('e1').start - 4} />
      <Audio src={staticFile('series/ch04/soundtrack.wav')} />
    </AbsoluteFill>
  );
};
