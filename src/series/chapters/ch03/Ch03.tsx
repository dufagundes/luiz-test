import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from './timeline.json';
import {Camera, Stage} from '../../../components/Camera';
import {Flash, Grain, Vignette, Wash} from '../../../components/Effects';
import {blink, easeIn, easeInOut, easeOut, shake, tween, wobble} from '../../../lib/anim';
import {Character, HandPhone} from '../../rig/Character';
import {ELIAS, MILO, NORA, THEO} from '../../cast';
import {Entry, ENTRY, stairY} from '../../locations/Entry';
import {Polaroid} from '../../props/Polaroid';
import {Glow, SeriesDefs} from '../../ui/Glow';
import {ChapterTitle, Countdown, SeriesSubtitles, Timeline} from '../../ui/SeriesUI';
import {InteractiveEnding} from '../../ui/InteractiveEnding';
import {makeSpeak} from '../../ui/Shots';
import {T} from '../../theme';

/**
 * THE LAST SIGNAL: Chapter 3, "Don't Let Him In"
 * Follows Ch.2 ending choice 1, "Open the door" (creator's creative decision, NOT an audience vote).
 * Minutes after Ch.2: Nora, the real (soaked) Theo and Milo have come down to the front hall.
 */
const TL = timelineJson as Timeline;
export const CH03_DURATION = TL.durationInFrames;
const speak = makeSpeak(TL);
const L = (id: string) => TL.lines.find((l) => l.id === id)!;
const W = (id: string, word: string) => L(id).words.find((w) => w.w === word)!.start;

// Ch.2 ended at ~107 s elapsed (23:58:13). Going downstairs takes ~30 s.
const ELAPSED_AT_START = 137;

const S = {
  hook: [0, 112],
  echoLook: [112, 246],
  theoStairs: [246, 320],
  barrier: [320, 430],
  taunt: [430, 572],
  noraTurn: [572, 596],
  confess: [596, 652],
  flashback: [652, 736],
  photoHand: [736, 805],
  photo: [805, 980],
  noraShock: [980, 1040],
  upstairs: [1040, 1086],
  echoCold: [1086, 1125],
  ending: [1125, CH03_DURATION],
} as const;

const D = ENTRY.door;
const ECHO = {x: D.x + D.w / 2, y: D.y + D.h, scale: 1.0};
const NORA_HALL = {x: 930, y: 1590, scale: 1.05};
const THEO_STAIR = {x: 470, y: stairY(470), scale: 1.0};
const MILO_STAIR = {x: 690, y: stairY(690), scale: 1.0};
const DRY = {x: ECHO.x, y: ECHO.y - 300, r: 280};

type Cam = {x: number; y: number; zoom: number; rotate?: number};

/** the dry Theo on the porch (drawn inside the doorway) */
const EchoOnPorch: React.FC<{g: number; mood?: 'smile' | 'cold' | 'talk'; talk?: number; lookX?: number; step?: number; recoil?: number; hold?: boolean}> = ({
  g,
  mood = 'smile',
  talk = 0,
  lookX = -0.6,
  step = 1,
  recoil = 0,
  hold = false,
}) => (
  <g>
    <Character
      who={THEO}
      x={ECHO.x}
      y={ECHO.y - 30 * (1 - step)}
      scale={ECHO.scale * (0.94 + 0.06 * step)}
      frame={g}
      walk={step > 0 && step < 1 ? step * 9 : undefined}
      lean={-recoil * 8}
      headTilt={mood === 'cold' ? -2 : 6}
      headTurn={-0.25}
      lookX={lookX}
      lookY={0}
      eyeOpen={mood === 'cold' ? 0.85 : 1}
      brow={mood === 'cold' ? -0.9 : -0.3}
      mouth={talk > 0 ? 'talk' : mood === 'cold' ? 'closed' : 'smile'}
      mouthOpen={talk}
      armL={{shoulder: 4, elbow: -6}}
      armR={hold ? {shoulder: 70, elbow: 70} : {shoulder: -4, elbow: 6}}
      hold={hold ? {side: 'R', item: <rect x={-26} y={-34} width={52} height={62} rx={3} fill="#efeadf" stroke="#d6cfbf" strokeWidth={3} />} : null}
      dark={0.3}
    />
  </g>
);

const Hall: React.FC<{
  g: number;
  cam: Cam;
  doorOpen?: number;
  echo?: React.ReactNode;
  barrier?: number;
  lightning?: number;
  red?: number;
  children?: React.ReactNode;
}> = ({g, cam, doorOpen = 1, echo, barrier = 0, lightning = 0, red = 0, children}) => (
  <Stage bg="#06060c">
    <SeriesDefs />
    <Camera x={cam.x} y={cam.y} zoom={cam.zoom} rotate={cam.rotate ?? 0}>
      <Entry frame={g} doorOpen={doorOpen} outside={echo} dryAround={echo ? DRY : null} barrier={barrier} lightning={lightning} redFromUpstairs={red} />
      {/* power is out: the hall is dark except lightning, phones, and the red radio glow */}
      <rect x={-600} y={-400} width={3200} height={2600} fill="#020208" opacity={0.28} />
      {children}
    </Camera>
  </Stage>
);

const noraProps = (g: number) => ({who: NORA, ...NORA_HALL, frame: g});
const theoProps = (g: number) => ({who: THEO, ...THEO_STAIR, frame: g, wet: true});

/* ================================================================ scenes */

/** HOOK 0–3.7s: click. The door swings open. Lightning: the dry Theo is right there. "Hi, Nora." */
const SceneHook: React.FC = () => {
  const f = useCurrentFrame();
  const g = f;
  const open = tween(f, [8, 22], [0, 1], easeOut);
  const lightning = tween(f, [17, 19], [0, 1]) * tween(f, [19, 30], [1, 0]);
  const zoom = tween(f, [0, 30, 112], [1.15, 1.25, 2.4], easeInOut);
  const camX = tween(f, [30, 112], [1150, ECHO.x - 10], easeInOut);
  const camY = tween(f, [30, 112], [1180, 940], easeInOut);
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: camX, y: camY, zoom, rotate: tween(f, [30, 112], [0, 3])}} doorOpen={open} lightning={lightning} echo={open > 0.3 ? <EchoOnPorch g={g} talk={speak(g, 'x1')} lookX={-0.3} /> : null}>
        <Character {...noraProps(g)} headTurn={0.7} lookX={1} eyeOpen={tween(f, [18, 26], [1, 1.4]) * blink(g, 60)} brow={0.9} mouth={f > 22 ? 'gasp' : 'closed'} mouthOpen={0.4} armL={{shoulder: -10, elbow: -10}} armR={{shoulder: tween(f, [0, 10], [-70, -10]), elbow: -40}} hold={{side: 'L', item: <HandPhone color="#eaf4ff" />}} lean={tween(f, [18, 30], [0, -6])} />
        <Glow x={ECHO.x - 30} y={ECHO.y - 470} r={140} color="phone" opacity={open * 0.5} />
      </Hall>
      <Flash opacity={lightning * 0.4} color="#e6eeff" />
      <Vignette strength={0.92} />
    </AbsoluteFill>
  );
};

/** 3.7–8.2s: same glasses, same jacket, same smile, but the rain won't touch him */
const SceneEchoLook: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.echoLook[0];
  // tilt down the figure: face → jacket → the dry dome
  const camY = tween(g, [112, 160, 186, 246], [905, 905, 1050, 1150], easeInOut);
  const zoom = tween(g, [112, 186, 246], [2.6, 2.2, 1.6], easeInOut);
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: ECHO.x - 20 + wobble(f, 3) * 3, y: camY, zoom, rotate: -2}} echo={<EchoOnPorch g={g} />}>
        <Glow x={ECHO.x - 30} y={ECHO.y - 470} r={140} color="phone" opacity={0.4} />
      </Hall>
      <Vignette strength={0.92} />
    </AbsoluteFill>
  );
};

/** 8.2–10.7s: on the stairs, the real Theo, soaked, terrified: "That's not me!" */
const SceneTheoStairs: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.theoStairs[0];
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: THEO_STAIR.x + 80, y: THEO_STAIR.y - 420, zoom: tween(f, [0, 74], [1.7, 2.0]), rotate: 4}}>
        <Character {...MILO_STAIR} who={MILO} frame={g} headTurn={0.6} lookX={1} eyeOpen={1.1} brow={0.7} mouth="closed" armL={{shoulder: -60, elbow: -60}} armR={{shoulder: 10, elbow: 10}} dark={0.35} />
        <Character
          {...theoProps(g)}
          headTurn={0.6}
          lookX={1}
          eyeOpen={1.35}
          brow={1}
          mouth={speak(g, 't1') > 0 ? 'talk' : 'grimace'}
          mouthOpen={speak(g, 't1')}
          armL={{shoulder: -10, elbow: -10}}
          armR={{shoulder: -100, elbow: -10}}
          shiver={0.4}
          lean={-6}
        />
        <Glow x={THEO_STAIR.x} y={THEO_STAIR.y - 500} r={260} color="white" opacity={0.18} />
      </Hall>
      <Vignette strength={0.92} />
    </AbsoluteFill>
  );
};

/** 10.7–14.3s: he steps forward… and stops. As if the doorway were a wall. */
const SceneBarrier: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.barrier[0];
  const step = tween(g, [325, 350], [0, 1], easeInOut);
  const hit = g >= 352 ? 1 : 0;
  const barrier = tween(g, [352, 356], [0, 1]) * tween(g, [356, 400], [1, 0.25]);
  const recoil = tween(g, [352, 358], [0, 1]) * tween(g, [358, 380], [1, 0]);
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: ECHO.x - 120 + shake(g, 352, 10, 8), y: 1180, zoom: tween(f, [0, 110], [1.35, 1.55], easeInOut)}} barrier={barrier} echo={<EchoOnPorch g={g} step={hit ? 1 : step} recoil={recoil} mood={g > 360 ? 'cold' : 'smile'} />}>
        <Character {...noraProps(g)} headTurn={0.7} lookX={1} eyeOpen={1.35} brow={1} mouth={g > 352 ? 'o' : 'frown'} armL={{shoulder: 20, elbow: 30}} armR={{shoulder: -20, elbow: -30}} lean={tween(g, [330, 350], [0, -10])} x={tween(g, [330, 352], [NORA_HALL.x, NORA_HALL.x - 50])} walk={g > 330 && g < 352 ? -(g - 330) * 0.4 : undefined} />
      </Hall>
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 14.3–19s: "Go on, Theo. Tell her where you were three years ago." */
const SceneTaunt: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.taunt[0];
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: ECHO.x - 10, y: tween(f, [0, 142], [920, 900]), zoom: tween(f, [0, 142], [2.5, 3.0], easeInOut), rotate: tween(f, [0, 142], [-2, -5])}} barrier={0.15} echo={<EchoOnPorch g={g} talk={speak(g, 'x2')} lookX={-1} mood="smile" />}>
        <Glow x={ECHO.x - 30} y={ECHO.y - 470} r={140} color="phone" opacity={0.4} />
      </Hall>
      <Wash opacity={tween(g, [517, 560], [0, 0.18])} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.94} />
    </AbsoluteFill>
  );
};

/** 19–19.9s: Nora turns: "Theo?" */
const SceneNoraTurn: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.noraTurn[0];
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: NORA_HALL.x - 20, y: 960, zoom: 2.6, rotate: 2}}>
        <Character {...noraProps(g)} headTurn={tween(f, [0, 10], [0.6, -0.8], easeOut)} lookX={tween(f, [0, 10], [1, -1])} eyeOpen={1.2} brow={0.8} mouth={speak(g, 'no1') > 0 ? 'talk' : 'frown'} mouthOpen={speak(g, 'no1')} armL={{shoulder: 20, elbow: 30}} armR={{shoulder: -20, elbow: -30}} />
      </Hall>
      <Vignette strength={0.94} />
    </AbsoluteFill>
  );
};

/** 19.9–21.7s: Theo confesses: "I was at the tower that night." */
const SceneConfess: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.confess[0];
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: THEO_STAIR.x + 10, y: THEO_STAIR.y - 600, zoom: tween(f, [0, 56], [2.6, 3.0]), rotate: -3}}>
        <Character {...theoProps(g)} headTurn={0.45} headTilt={tween(f, [0, 56], [0, 7])} lookX={0.6} lookY={0.6} eyeOpen={0.9 * blink(g, 4)} brow={1} mouth={speak(g, 't2') > 0 ? 'talk' : 'frown'} mouthOpen={speak(g, 't2')} armL={{shoulder: -10, elbow: -10}} armR={{shoulder: 10, elbow: 10}} />
      </Hall>
      <Vignette strength={0.94} />
    </AbsoluteFill>
  );
};

/** 21.7–24.5s: FLASHBACK, three years ago. Dad walks into the light… and the Echo walks out. */
const SceneFlashback: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.flashback[0];
  const out = tween(g, [700, 736], [0, 1], easeOut); // the Echo emerging
  const eliasK = tween(g, [652, 690], [0, 1], easeIn);
  return (
    <AbsoluteFill style={{filter: 'grayscale(0.55) sepia(0.25) contrast(1.05)'}}>
      <Stage bg="#0b0f1e">
        <SeriesDefs />
        <defs>
          <linearGradient id="fbSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0f22" />
            <stop offset="1" stopColor="#262b48" />
          </linearGradient>
          <radialGradient id="fbLight">
            <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="0.3" stopColor="#eef6ff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#eef6ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform={`translate(540 960) scale(${tween(f, [0, 84], [1.0, 1.15])}) translate(-540 -960)`}>
          <rect x={-200} y={-200} width={1500} height={2400} fill="url(#fbSky)" />
          {/* tower */}
          <path d="M 560 1250 L 640 300 L 720 1250" stroke="#3a4470" strokeWidth={14} fill="none" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M ${575 + i * 10} ${1180 - i * 150} L ${705 - i * 10} ${1100 - i * 150} M ${705 - i * 10} ${1180 - i * 150} L ${575 + i * 10} ${1100 - i * 150}`} stroke="#3a4470" strokeWidth={6} />
          ))}
          {/* the light at the base of the tower */}
          <circle cx={640} cy={1180} r={420 + 30 * Math.sin(g * 0.3)} fill="url(#fbLight)" />
          <path d="M -200 1300 Q 540 1150 1300 1290 L 1300 2200 L -200 2200 Z" fill="#0b0f1e" />
          {/* Elias walks into the light */}
          <Character who={ELIAS} x={tween(eliasK, [0, 1], [430, 620])} y={tween(eliasK, [0, 1], [1320, 1220])} scale={tween(eliasK, [0, 1], [0.85, 0.45])} frame={g} walk={g * 0.35} headTurn={0.8} lookX={1} dark={0.5} opacity={1 - tween(g, [680, 694], [0, 1])} />
          {/* the Echo walks out of it */}
          {g > 700 ? <Character who={THEO} x={tween(out, [0, 1], [640, 700])} y={tween(out, [0, 1], [1220, 1400])} scale={tween(out, [0, 1], [0.4, 0.95])} frame={g} walk={g * 0.3} headTurn={0} dark={0.92} opacity={out} /> : null}
          {/* young Theo (14) hiding behind a rock, watching */}
          <path d="M 40 1720 Q 180 1560 330 1700 L 360 2000 L 20 2000 Z" fill="#070a14" />
          <Character who={THEO} x={170} y={1900} scale={0.9} frame={g} headTurn={0.6} lookX={1} lookY={-0.4} eyeOpen={1.4} brow={1} mouth="gasp" mouthOpen={0.5} dark={0.45} />
        </g>
      </Stage>
      <AbsoluteFill style={{padding: '200px 60px', pointerEvents: 'none'}}>
        <div style={{fontFamily: T.font, fontWeight: 900, fontSize: 40, letterSpacing: 8, color: '#e9eeff', opacity: tween(f, [0, 8], [0, 0.85])}}>3 YEARS AGO</div>
      </AbsoluteFill>
      <Grain frame={g} opacity={0.18} />
      <Vignette strength={0.95} />
    </AbsoluteFill>
  );
};

/** 24.5–26.8s: "He wasn't the only one up there, Nora." The photo slides through the doorway. */
const ScenePhotoHand: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.photoHand[0];
  const toss = tween(g, [782, 800], [0, 1], easeOut);
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: ECHO.x - 140, y: 1200, zoom: tween(f, [0, 69], [1.5, 1.7])}} barrier={tween(g, [784, 790], [0.1, 0.7]) * tween(g, [790, 805], [1, 0.2])} echo={<EchoOnPorch g={g} talk={speak(g, 'x3')} lookX={-0.8} hold={g < 784} />}>
        <Character {...noraProps(g)} headTurn={0.65} lookX={0.9} lookY={tween(toss, [0, 1], [0, 0.8])} eyeOpen={1.2} brow={0.8} mouth="frown" armL={{shoulder: 20, elbow: 30}} armR={{shoulder: -20, elbow: -30}} />
        {/* the photo skids across the threshold to Nora's feet */}
        {toss > 0 ? (
          <g transform={`translate(${tween(toss, [0, 1], [ECHO.x - 40, NORA_HALL.x + 120])} ${tween(toss, [0, 1], [ECHO.y - 160, NORA_HALL.y - 10])}) rotate(${toss * 380})`}>
            <rect x={-30} y={-36} width={60} height={72} rx={3} fill="#efeadf" stroke="#d6cfbf" strokeWidth={3} />
            <rect x={-24} y={-30} width={48} height={48} fill="#1d2440" />
          </g>
        ) : null}
      </Hall>
      <Vignette strength={0.92} />
    </AbsoluteFill>
  );
};

/** 26.8–32.7s: the photo. The tower. Her father. Theo. And a girl in a yellow raincoat. */
const ScenePhoto: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.photo[0];
  // pan: whole photo → tower → father → Theo → the girl
  const K = [805, 840, 866, 888, 900, 915, 930, 960, 980];
  const fx = tween(g, K, [260, 330, 330, 330, 330, 190, 190, 105, 105], easeInOut);
  const fy = tween(g, K, [300, 240, 240, 330, 330, 330, 330, 340, 340], easeInOut);
  const z = tween(g, K, [1.0, 1.5, 1.5, 2.6, 2.6, 2.6, 2.6, 3.2, 3.5], easeInOut);
  return (
    <AbsoluteFill>
      <Stage bg="#0c0b10">
        <SeriesDefs />
        <g transform={`translate(540 760) rotate(${tween(f, [0, 175], [-4, 2])}) scale(${1.45 * z}) translate(${-fx} ${-fy})`}>
          <Polaroid frame={g} glow={1} />
        </g>
        <circle cx={540} cy={820} r={600} fill="url(#gPhone)" opacity={0.12} style={{mixBlendMode: 'screen'}} />
        {/* Nora's thumbs */}
        <ellipse cx={120} cy={1380} rx={70} ry={100} fill={NORA.palette.skin} transform="rotate(25 120 1380)" />
        <ellipse cx={960} cy={1380} rx={70} ry={100} fill={NORA.palette.skin} transform="rotate(-25 960 1380)" />
      </Stage>
      <Wash opacity={tween(g, [945, 975], [0, 0.25])} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};

/** 32.7–34.7s: "That's me… but I was never there." Lightning. */
const SceneNoraShock: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.noraShock[0];
  const lightning = tween(g, [993, 995], [0, 1]) * tween(g, [995, 1006], [1, 0]);
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: NORA_HALL.x - 10, y: tween(f, [0, 60], [960, 940]), zoom: tween(f, [0, 60], [2.5, 3.0], easeIn), rotate: tween(f, [0, 60], [0, -4])}} lightning={lightning}>
        <Character
          {...noraProps(g)}
          headTurn={0.15}
          headTilt={-3}
          lookX={-0.1}
          lookY={0.7}
          eyeOpen={1.35}
          brow={1}
          mouth={speak(g, 'no2') > 0 ? 'talk' : 'frown'}
          mouthOpen={speak(g, 'no2')}
          armL={{shoulder: -40, elbow: -110}}
          armR={{shoulder: 40, elbow: 110}}
          hold={{side: 'R', item: <rect x={-28} y={-40} width={56} height={66} rx={3} fill="#efeadf" stroke="#d6cfbf" strokeWidth={3} />}}
          shiver={0.5}
        />
        <Glow x={ECHO.x} y={1000} r={500} color="white" opacity={lightning * 0.6} />
      </Hall>
      <Flash opacity={lightning * 0.35} color="#e6eeff" />
      <Vignette strength={0.94} />
    </AbsoluteFill>
  );
};

/** 34.7–36.2s: from upstairs, red light floods down the stairs: the radio, in Nora's own voice */
const SceneUpstairs: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.upstairs[0];
  const red = tween(g, [1038, 1048], [0, 1]) * (0.8 + 0.2 * Math.sin(g * 0.5));
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: 560, y: 820, zoom: tween(f, [0, 46], [1.4, 1.7], easeIn), rotate: 6}} red={red}>
        <Character {...MILO_STAIR} who={MILO} frame={g} headTurn={-0.6} lookX={-1} lookY={-0.6} eyeOpen={1.3} brow={1} mouth="o" mouthOpen={0.4} armL={{shoulder: -20, elbow: -20}} armR={{shoulder: 20, elbow: 20}} />
        <Character {...theoProps(g)} headTurn={-0.4} lookX={-0.8} lookY={-0.8} eyeOpen={1.3} brow={1} mouth="gasp" mouthOpen={0.4} armL={{shoulder: -10, elbow: -10}} armR={{shoulder: 10, elbow: 10}} />
      </Hall>
      <Wash opacity={0.25 * red} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.92} />
    </AbsoluteFill>
  );
};

/** 36.2–37.5s: the Echo hears the radio. For the first time, his smile disappears. */
const SceneEchoCold: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.echoCold[0];
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: ECHO.x - 10, y: 905, zoom: tween(f, [0, 39], [2.8, 3.4], easeIn)}} barrier={0.12} red={0.5} echo={<EchoOnPorch g={g} mood="cold" lookX={-0.4} />}>
        <Glow x={ECHO.x - 30} y={900} r={300} color="red" opacity={0.35} />
      </Hall>
      <Vignette strength={0.95} />
    </AbsoluteFill>
  );
};

/** 37.5–45.9s: decision background: the doorway, Nora's hand on the door, the Echo waiting */
const SceneEndingBg: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.ending[0];
  return (
    <AbsoluteFill>
      <Hall g={g} cam={{x: 1180, y: 1120, zoom: 1.3 + f * 0.0012}} barrier={0.15} red={0.4} echo={<EchoOnPorch g={g} mood="cold" lookX={-0.6} />}>
        <Character {...noraProps(g)} headTurn={0.7} lookX={1} eyeOpen={1.2 * blink(g, 9)} brow={0.9} mouth="frown" armL={{shoulder: 10, elbow: 20}} armR={{shoulder: -90, elbow: -20}} />
      </Hall>
    </AbsoluteFill>
  );
};

const IconDoorShut: React.FC = () => (
  <svg viewBox="0 0 150 150" width={120} height={120}>
    <rect x={35} y={15} width={80} height={125} rx={6} fill="#4a2f3a" stroke="#ffd0d6" strokeWidth={5} />
    <circle cx={100} cy={85} r={7} fill="#e9d48a" />
    <path d="M 20 70 L 45 70 M 105 70 L 130 70" stroke="#ff2e4d" strokeWidth={6} strokeLinecap="round" />
    <rect x={20} y={138} width={110} height={6} fill="#ffd0d6" />
  </svg>
);
const IconInvite: React.FC = () => (
  <svg viewBox="0 0 150 150" width={120} height={120}>
    <rect x={20} y={15} width={80} height={125} rx={6} fill="#0d1428" stroke="#cfefff" strokeWidth={5} />
    <rect x={20} y={15} width={22} height={125} fill="#4a2f3a" />
    <circle cx={70} cy={60} r={18} fill="#0b0a0e" />
    <rect x={56} y={78} width={28} height={50} fill="#0b0a0e" />
    <path d="M 110 75 L 140 75 M 128 63 L 140 75 L 128 87" stroke="#cfefff" strokeWidth={6} fill="none" strokeLinecap="round" />
  </svg>
);

/* ================================================================ chapter */
const SCENES: [readonly [number, number], React.FC][] = [
  [S.hook, SceneHook],
  [S.echoLook, SceneEchoLook],
  [S.theoStairs, SceneTheoStairs],
  [S.barrier, SceneBarrier],
  [S.taunt, SceneTaunt],
  [S.noraTurn, SceneNoraTurn],
  [S.confess, SceneConfess],
  [S.flashback, SceneFlashback],
  [S.photoHand, ScenePhotoHand],
  [S.photo, ScenePhoto],
  [S.noraShock, SceneNoraShock],
  [S.upstairs, SceneUpstairs],
  [S.echoCold, SceneEchoCold],
  [S.ending, SceneEndingBg],
];

export const Chapter03: React.FC = () => {
  const frame = useCurrentFrame();
  const flashIn = tween(frame, [650, 652], [0, 1]) * tween(frame, [652, 660], [1, 0]);
  const flashOut = tween(frame, [734, 736], [0, 1]) * tween(frame, [736, 744], [1, 0]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SCENES.map(([[from, to], C], i) => (
        <Sequence key={i} from={from} durationInFrames={to - from}>
          <C />
        </Sequence>
      ))}
      <Flash opacity={Math.max(flashIn, flashOut) * 0.9} color="#ffffff" />
      <Grain frame={frame} opacity={0.07} />
      <ChapterTitle at={116} chapter={3} title="DON'T LET HIM IN" hold={66} />
      <Countdown zeroFrame={0} elapsedAtZero={ELAPSED_AT_START} show={frame >= 30 ? 1 : 0} urgent={frame >= S.upstairs[0]} />
      <SeriesSubtitles timeline={TL} />
      <InteractiveEnding
        chapter={3}
        nextChapter={4}
        wording="v2"
        at={S.ending[0]}
        opt1At={S.ending[0] + 8}
        opt2At={S.ending[0] + 16}
        commentAt={W('e2', 'Comment')}
        cardAt={L('e2').end + 8}
        question="The radio says shut it. He has answers. What should Nora do?"
        options={[
          {title: 'Close the door', desc: 'Trust the radio voice.', icon: <IconDoorShut />},
          {title: 'Let him in', desc: 'Get the truth about the photo.', icon: <IconInvite />},
        ]}
      />
      <Audio src={staticFile('series/ch03/soundtrack.wav')} />
    </AbsoluteFill>
  );
};
