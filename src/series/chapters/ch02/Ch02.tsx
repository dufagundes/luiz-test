import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from './timeline.json';
import {Stage} from '../../../components/Camera';
import {Flash, Grain, Vignette, Wash} from '../../../components/Effects';
import {blink, easeIn, easeInOut, easeOut, shake, tween, wobble} from '../../../lib/anim';
import {Character, HandPhone} from '../../rig/Character';
import {MILO, NORA, THEO} from '../../cast';
import {Town} from '../../locations/Town';
import {ATTIC} from '../../locations/Attic';
import {Yard} from '../../locations/Yard';
import {SignalPhone} from '../../props/SignalPhone';
import {MiloDrawingPage2} from '../../props/MiloDrawing';
import {HamRadio} from '../../props/HamRadio';
import {Glow, SeriesDefs} from '../../ui/Glow';
import {ChapterTitle, ChoiceCard, Countdown, SeriesSubtitles, Timeline} from '../../ui/SeriesUI';
import {AtticShot, Flashlight, makeSpeak} from '../../ui/Shots';
import {T} from '../../theme';

/**
 * THE LAST SIGNAL: Chapter 2, "Three Weeks"
 * Follows the Ch.1 audience choice: A: Let Theo explain.
 * Starts seconds after Ch.1: the blackout, the attic lit only by phones, the tower beacon white.
 */
const TL = timelineJson as Timeline;
export const CH02_DURATION = TL.durationInFrames;
const speak = makeSpeak(TL);
const L = (id: string) => TL.lines.find((l) => l.id === id)!;
const W = (id: string, word: string) => L(id).words.find((w) => w.w === word)!.start;

// Ch.1 ended ~58 s after the message (countdown 23:59:02). Ch.2 picks up right there.
const ELAPSED_AT_START = 58;

const S = {
  hook: [0, 130],
  theoTalk: [130, 250],
  secondMsg: [250, 345],
  noraClose: [345, 390],
  theoClose: [390, 450],
  tower: [450, 535],
  milo: [535, 572],
  drawing: [572, 640],
  town: [640, 765],
  noraPhone: [765, 805],
  notif: [805, 990],
  yard: [990, 1100],
  echoPhone: [1100, 1140],
  reaction: [1140, 1176],
  choice: [1176, CH02_DURATION],
} as const;

// same marks as Chapter 1 (continuity)
const NORA_DESK = {x: 1180, y: 1560, scale: 1.05};
const THEO_IN = {x: 960, y: 1580, scale: 1.0};
const MILO_SPOT = {x: 560, y: 1580};
const FLASH_FROM = {x: 1120, y: 1150}; // Nora's phone, held up

/** dark attic (power out, beacon white) + Nora's phone flashlight on Theo */
const DarkAttic: React.FC<{g: number; cam: {x: number; y: number; zoom: number; rotate?: number}; beam?: number; children?: React.ReactNode; radioDanger?: number}> = ({
  g,
  cam,
  beam = 1,
  children,
  radioDanger = 1,
}) => (
  <AtticShot
    g={g}
    cam={cam}
    power={0}
    radioPower={0.55}
    radioDanger={radioDanger}
    windowOpen={0.9}
    towerWhite
    overlay={<rect x={-600} y={-400} width={3200} height={2600} fill="#020208" opacity={0.3} />}
  >
    {children}
    <Flashlight x1={FLASH_FROM.x} y1={FLASH_FROM.y} x2={THEO_IN.x + 10} y2={THEO_IN.y - 600} opacity={beam} />
    <Glow x={ATTIC.radio.x + 180} y={ATTIC.radio.y + 100} r={300} color="red" opacity={0.35} />
  </AtticShot>
);

const theoBase = (g: number) => ({
  who: THEO,
  ...THEO_IN,
  frame: g,
  wet: true, // the REAL Theo climbed in through the rain (Ch.1). He is soaked.
});

/* ================================================================ scenes */

/** HOOK 0–4.3s: lightning, then darkness, then a flashlight click: Theo's face right in front of us */
const SceneHook: React.FC = () => {
  const f = useCurrentFrame();
  const g = f;
  const flash = tween(f, [0, 2], [0, 1]) * tween(f, [2, 9], [1, 0]);
  const on = f >= 16 ? 1 : 0;
  const zoom = tween(f, [16, 130], [2.9, 1.45], easeInOut);
  const camX = tween(f, [16, 130], [THEO_IN.x + 20, 1080], easeInOut);
  const camY = tween(f, [16, 130], [985, 1130], easeInOut);
  return (
    <AbsoluteFill>
      {f < 16 ? (
        <AbsoluteFill style={{background: '#000'}}>
          <AbsoluteFill style={{opacity: flash}}>
            <DarkAttic g={g} cam={{x: THEO_IN.x + 20, y: 985, zoom: 2.9}} beam={0}>
              <Character {...theoBase(g)} headTurn={0.2} eyeOpen={1.2} brow={0.9} mouth="frown" dark={0.6} />
            </DarkAttic>
          </AbsoluteFill>
          <Flash opacity={flash * 0.5} color="#dfe8ff" />
        </AbsoluteFill>
      ) : (
        <DarkAttic g={g} cam={{x: camX, y: camY, zoom}} beam={on}>
          <Character
            {...theoBase(g)}
            headTurn={0.35}
            lookX={0.7}
            eyeOpen={tween(f, [16, 24], [0.6, 1.2]) * blink(g, 30)}
            brow={0.9}
            mouth="frown"
            armL={{shoulder: -40, elbow: -60}}
            armR={{shoulder: -60, elbow: -50}}
            dark={0.05}
          />
          <Character
            who={NORA}
            {...NORA_DESK}
            frame={g}
            headTurn={-0.7}
            lookX={-1}
            eyeOpen={1.1 * blink(g, 50)}
            brow={-0.6}
            mouth="frown"
            armL={{shoulder: -10, elbow: -20}}
            armR={{shoulder: 40, elbow: 130}}
            hold={{side: 'R', item: <HandPhone glow={1} color="#eaf4ff" />}}
            dark={0.45}
          />
        </DarkAttic>
      )}
      <Vignette strength={0.95} />
    </AbsoluteFill>
  );
};

/** 4.3–8.3s: Theo explains: "Three weeks ago… then a second one. Only for me." */
const SceneTheoTalk: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.theoTalk[0];
  const showPhone = tween(g, [190, 205], [0, 1], easeOut);
  return (
    <AbsoluteFill>
      <DarkAttic g={g} cam={{x: tween(f, [0, 120], [1060, 1010]) + wobble(f, 2) * 3, y: 1060, zoom: tween(f, [0, 120], [1.6, 1.9], easeInOut), rotate: -2}}>
        <Character
          {...theoBase(g)}
          headTurn={tween(f, [0, 120], [0.55, 0.3])}
          headTilt={tween(f, [0, 60], [0, -6])}
          lookX={0.8}
          lookY={tween(showPhone, [0, 1], [0, 0.6])}
          eyeOpen={blink(g, 7)}
          brow={0.8}
          mouth={speak(g, 't1') > 0 ? 'talk' : 'frown'}
          mouthOpen={speak(g, 't1')}
          armL={{shoulder: -20, elbow: -40}}
          armR={{shoulder: tween(showPhone, [0, 1], [-10, -40]), elbow: tween(showPhone, [0, 1], [10, -110])}}
          hold={{side: 'R', item: <HandPhone glow={showPhone} />}}
          dark={0.05}
        />
        <Character who={NORA} {...NORA_DESK} frame={g} headTurn={-0.7} lookX={-1} eyeOpen={blink(g, 21)} brow={-0.4} mouth="closed" armR={{shoulder: 40, elbow: 130}} hold={{side: 'R', item: <HandPhone color="#eaf4ff" />}} dark={0.45} />
        <Glow x={THEO_IN.x - 40} y={1050} r={150} color="phone" opacity={0.6 * showPhone} />
      </DarkAttic>
      <Vignette strength={0.92} />
    </AbsoluteFill>
  );
};

/** 8.3–11.5s: the second message, the one he never showed anyone */
const SceneSecondMsg: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.secondMsg[0];
  return (
    <AbsoluteFill>
      <Stage bg="#04050a">
        <SeriesDefs />
        <g transform={`translate(540 960) scale(${tween(f, [0, 95], [1.0, 1.18], easeIn)}) rotate(${tween(f, [0, 95], [-3, 1])}) translate(-540 ${-960 + tween(f, [0, 28], [-40, -230], easeInOut)})`}>
          <SignalPhone
            frame={g}
            x={540}
            y={980}
            scale={1.1}
            mode="thread"
            notifAt={S.secondMsg[0] - 10}
            owner="Theo"
            dateLabel="FRI, OCT 23 · 11:47 PM"
            id="theo2"
            second={{lines: ['IF NORA GOES TO', 'THE TOWER, SHE', "DOESN'T COME", 'BACK.'], at: 262, label: 'FRI, OCT 23 · 11:48 PM · ONLY TO THEO'}}
          />
        </g>
        <ellipse cx={990} cy={1560} rx={70} ry={110} fill={THEO.palette.skin} transform="rotate(-30 990 1560)" />
      </Stage>
      <Wash opacity={tween(g, [262, 290], [0, 0.22])} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.88} />
    </AbsoluteFill>
  );
};

/** 11.5–13s: Nora: "And you just… didn't tell me?" */
const SceneNoraClose: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.noraClose[0];
  return (
    <AbsoluteFill>
      <DarkAttic g={g} cam={{x: NORA_DESK.x - 10, y: 950, zoom: tween(f, [0, 45], [2.5, 2.7]), rotate: -3}} beam={0.6}>
        <Character
          who={NORA}
          {...NORA_DESK}
          frame={g}
          headTurn={-0.55}
          headTilt={4}
          lookX={-0.9}
          eyeOpen={1.15}
          brow={0.4}
          mouth={speak(g, 'no1') > 0 ? 'talk' : 'frown'}
          mouthOpen={speak(g, 'no1')}
          armR={{shoulder: 40, elbow: 130}}
          hold={{side: 'R', item: <HandPhone color="#eaf4ff" />}}
          shiver={0.25}
          dark={0.1}
        />
        <Glow x={NORA_DESK.x - 60} y={1000} r={200} color="white" opacity={0.35} />
      </DarkAttic>
      <Vignette strength={0.94} />
    </AbsoluteFill>
  );
};

/** 13–15s: Theo: "I thought if you never knew… you'd never go." */
const SceneTheoClose: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.theoClose[0];
  return (
    <AbsoluteFill>
      <DarkAttic g={g} cam={{x: THEO_IN.x + 20, y: 970, zoom: tween(f, [0, 60], [2.4, 2.75]), rotate: 3}}>
        <Character
          {...theoBase(g)}
          headTurn={0.4}
          headTilt={tween(f, [0, 60], [0, 8])}
          lookX={0.4}
          lookY={tween(f, [20, 50], [0, 0.9])}
          eyeOpen={blink(g, 13) * 0.9}
          brow={1}
          mouth={speak(g, 't2') > 0 ? 'talk' : 'frown'}
          mouthOpen={speak(g, 't2')}
          armL={{shoulder: -10, elbow: -10}}
          armR={{shoulder: 10, elbow: 10}}
          dark={0.05}
        />
      </DarkAttic>
      <Vignette strength={0.94} />
    </AbsoluteFill>
  );
};

/** 15–17.8s: "But the radio had just told her to go. Alone." The white beacon through the window. */
const SceneTower: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.tower[0];
  if (f < 40) {
    return (
      <AbsoluteFill>
        <DarkAttic g={g} cam={{x: ATTIC.window.x + 220, y: ATTIC.window.y + 200, zoom: tween(f, [0, 40], [3.0, 3.8], easeIn)}} beam={0} />
        <Vignette strength={0.95} />
      </AbsoluteFill>
    );
  }
  const s = f - 40;
  return (
    <AbsoluteFill>
      <Stage bg="#06060c">
        <SeriesDefs />
        <Glow x={540} y={900} r={900} color="red" opacity={0.4} />
        <g transform={`translate(${540 + shake(s, 0, 8, 10)} 900) scale(${tween(s, [0, 45], [2.3, 2.6])}) rotate(3) translate(-180 -110)`}>
          <HamRadio frame={g} power={1} danger={1} wave={0.3 + 0.2 * Math.sin(g * 0.4)} />
        </g>
      </Stage>
      <Wash opacity={0.2} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 17.8–19s: Milo steps into the flashlight with a new page */
const SceneMilo: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.milo[0];
  return (
    <AbsoluteFill>
      <DarkAttic g={g} cam={{x: MILO_SPOT.x + 40, y: 1240, zoom: tween(f, [0, 37], [2.0, 2.3])}} beam={0}>
        <Character
          who={MILO}
          {...MILO_SPOT}
          frame={g}
          headTurn={0.35}
          lookX={0.7}
          eyeOpen={1.05}
          brow={0.6}
          mouth={speak(g, 'm1') > 0 ? 'talk' : 'closed'}
          mouthOpen={speak(g, 'm1')}
          armL={{shoulder: -40, elbow: -100}}
          armR={{shoulder: 40, elbow: 100}}
        />
        <Glow x={MILO_SPOT.x + 10} y={1170} r={220} color="white" opacity={0.4} />
      </DarkAttic>
      <Vignette strength={0.93} />
    </AbsoluteFill>
  );
};

/** 19–21.3s: page two: the boy has Theo's glasses… and his phone says 11:47 */
const SceneDrawing: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.drawing[0];
  const z = tween(f, [0, 68], [1.0, 1.35], easeInOut);
  const fx = tween(f, [20, 68], [420, 405]);
  const fy = tween(f, [20, 68], [310, 300]);
  return (
    <AbsoluteFill>
      <Stage bg="#0c0b10">
        <SeriesDefs />
        <g transform={`translate(540 860) rotate(${tween(f, [0, 68], [3, -2])}) scale(${1.25 * z}) translate(${-fx} ${-fy})`}>
          <MiloDrawingPage2 frame={g} glow={tween(g, [606, 625], [0, 1])} />
        </g>
        {/* flashlight pool on the paper */}
        <circle cx={540} cy={860} r={520} fill="url(#gWhite)" opacity={0.18} style={{mixBlendMode: 'screen'}} />
        <circle cx={140} cy={1290} r={46} fill={MILO.palette.skin} />
        <circle cx={940} cy={1280} r={46} fill={MILO.palette.skin} />
      </Stage>
      <Wash opacity={tween(g, [606, 630], [0, 0.25])} color={T.phone} blend="overlay" />
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};

/** 21.3–25.5s: Harlow Point, black. Only one building still has power: the sheriff's station. */
const SceneTown: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.town[0];
  return (
    <AbsoluteFill>
      <Stage bg={T.sky0}>
        <SeriesDefs />
        <Town
          frame={g}
          zoom={tween(f, [0, 125], [1.05, 1.75], easeInOut)}
          focusX={tween(f, [0, 125], [600, 330])}
          focusY={tween(f, [0, 125], [1000, 1120])}
          camX={tween(f, [0, 125], [80, 20])}
          phonesOnAt={-100}
          blackoutAt={-100}
          towerWhiteAt={-100}
          atticLight={0}
          stationLit={tween(g, [700, 712], [0, 1])}
        />
      </Stage>
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};

/** 25.5–26.8s: Nora's phone buzzes in her hand */
const SceneNoraPhone: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.noraPhone[0];
  const buzz = g >= 800 ? Math.sin(g * 3.2) * 6 : 0;
  return (
    <AbsoluteFill>
      <DarkAttic g={g} cam={{x: NORA_DESK.x - 30 + buzz * 0.3, y: 1080, zoom: tween(f, [0, 40], [2.2, 2.6], easeIn)}} beam={0}>
        <Character
          who={NORA}
          {...NORA_DESK}
          frame={g}
          headTurn={0.1}
          lookX={-0.3}
          lookY={0.9}
          eyeOpen={tween(g, [800, 806], [1, 1.3])}
          brow={0.8}
          mouth={g > 802 ? 'o' : 'closed'}
          armL={{shoulder: -30, elbow: -110}}
          armR={{shoulder: 30 + buzz * 0.5, elbow: 120}}
          hold={{side: 'R', item: <HandPhone glow={1} />}}
        />
        <Glow x={NORA_DESK.x - 40} y={1080} r={240} color="phone" opacity={0.75} />
      </DarkAttic>
      <Vignette strength={0.93} />
    </AbsoluteFill>
  );
};

/** 26.8–33s: "Nora, it's me. I'm outside. Don't trust whoever is with you." */
const SceneNotif: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.notif[0];
  const buzz = f < 12 ? Math.sin(f * 3.1) * 8 : 0;
  return (
    <AbsoluteFill>
      <Stage bg="#04050a">
        <SeriesDefs />
        <Glow x={540} y={900} r={900} color="phone" opacity={0.22} />
        <g transform={`translate(540 960) scale(${tween(f, [0, 185], [1, 1.2], easeInOut)}) rotate(${tween(f, [0, 185], [2, -2])}) translate(-540 -960)`}>
          <SignalPhone
            frame={g}
            x={540 + buzz}
            y={880}
            scale={1.12}
            mode="lock"
            id="noraLock2"
            lockTime="11:48"
            notifAt={S.notif[0] + 2}
            notif={{title: 'THEO', sub: 'now', icon: 'contact', firstLineRed: false, lines: ["NORA, IT'S ME.", "I'M OUTSIDE.", "DON'T TRUST", 'WHOEVER IS', 'WITH YOU.']}}
            glitch={g > 965 ? tween(g, [965, 990], [0, 1]) : 0}
          />
        </g>
      </Stage>
      <Wash opacity={tween(g, [920, 976], [0, 0.22])} color={T.uiRed} blend="overlay" />
      <Vignette strength={0.88} />
    </AbsoluteFill>
  );
};

/** The Echo of Theo in the yard: identical, but bone-dry, looking up at the attic, phone glowing */
const YardTheo: React.FC<{g: number; x: number; y: number; scale: number}> = ({g, x, y, scale}) => (
  <g>
    <ellipse cx={x} cy={y + 6} rx={110 * scale} ry={24 * scale} fill="#000" opacity={0.4} />
    <Character
      who={THEO}
      x={x}
      y={y}
      scale={scale}
      frame={g}
      headTilt={-4}
      lookX={0.1}
      lookY={-1}
      eyeOpen={1.05}
      brow={-0.2}
      mouth="closed"
      armL={{shoulder: 4, elbow: -4}}
      armR={{shoulder: 30, elbow: 115}}
      hold={{side: 'R', item: <HandPhone glow={1} />}}
      dark={0.25}
    />
    <Glow x={x - 40 * scale} y={y - 480 * scale} r={170 * scale} color="phone" opacity={0.6} />
  </g>
);

/** 33–36.7s: down in the yard stood Theo. Dry, in the pouring rain. */
const SceneYard: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.yard[0];
  const lightning = tween(g, [1021, 1023], [0, 1]) * tween(g, [1023, 1034], [1, 0]);
  const z = tween(f, [0, 110], [1.15, 1.75], easeInOut);
  const fy = tween(f, [0, 110], [900, 790]);
  const tx = {x: 540, y: 1180, s: 1.0};
  return (
    <AbsoluteFill>
      <Stage bg="#050710">
        <SeriesDefs />
        <g transform={`translate(540 960) scale(${z}) translate(-540 ${-fy})`}>
          <Yard frame={g} lightning={lightning} figure={<YardTheo g={g} x={tx.x} y={tx.y} scale={tx.s} />} dryAround={{x: tx.x, y: tx.y - 300 * tx.s, r: 300 * tx.s}} />
        </g>
        {/* the attic window frame (we are looking down through it) */}
        <rect x={0} y={0} width={1080} height={1920} fill="none" stroke="#1a1626" strokeWidth={70} />
        <line x1={540} y1={0} x2={540} y2={1920} stroke="#1a1626" strokeWidth={26} opacity={tween(f, [0, 30], [1, 0])} />
      </Stage>
      <Flash opacity={lightning * 0.35} color="#e6eeff" />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 36.7–38s: his phone, glowing in the rain: 11:47 (real time is 11:48) */
const SceneEchoPhone: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.echoPhone[0];
  return (
    <AbsoluteFill>
      <Stage bg="#03050c">
        <SeriesDefs />
        <g transform={`translate(540 900) scale(${tween(f, [0, 40], [1.0, 1.15])}) rotate(-8)`}>
          <circle cx={0} cy={0} r={560} fill="url(#gPhone)" opacity={0.4} style={{mixBlendMode: 'screen'}} />
          <rect x={-250} y={-470} width={500} height={940} rx={70} fill="#0b0c12" stroke="#3b4058" strokeWidth={6} />
          <rect x={-232} y={-452} width={464} height={904} rx={56} fill="#0f1730" />
          <text x={0} y={-120} fill="#e9eeff" fontFamily={T.font} fontWeight={300} fontSize={170} textAnchor="middle">
            11:47
          </text>
          <text x={0} y={-50} fill="#b8c3e8" fontFamily={T.font} fontWeight={600} fontSize={32} textAnchor="middle">
            Friday, November 13
          </text>
          <ellipse cx={170} cy={430} rx={110} ry={160} fill={THEO.palette.skin} transform="rotate(-20 170 430)" />
        </g>
        {/* rain falling everywhere around the phone, never on it */}
        {[...Array(50)].map((_, i) => {
          const x = (i * 97.3) % 1080;
          const y = ((i * 151.1 + g * 48) % 2100) - 100;
          if (x > 220 && x < 880 && y > 300 && y < 1500) return null;
          return <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 70} stroke="#a9c0ee" strokeWidth={3} opacity={0.4} />;
        })}
      </Stage>
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

/** 38–39.2s: Nora spins around. The Theo in her room is soaked… and terrified. */
const SceneReaction: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.reaction[0];
  return (
    <AbsoluteFill>
      <DarkAttic g={g} cam={{x: THEO_IN.x + 30, y: 980, zoom: tween(f, [0, 36], [2.0, 2.6], easeIn), rotate: tween(f, [0, 36], [0, -5])}} beam={1}>
        <Character
          {...theoBase(g)}
          headTurn={0.4 + Math.sin(f * 0.5) * 0.35}
          lookX={0.9}
          eyeOpen={1.4}
          brow={1}
          mouth="grimace"
          armL={{shoulder: -60, elbow: -80}}
          armR={{shoulder: -110, elbow: -40}}
          shiver={0.7}
          dark={0.02}
        />
      </DarkAttic>
      <Vignette strength={0.95} />
    </AbsoluteFill>
  );
};

/** 39.2–52s: decision background: the yard, the dry Theo still looking up */
const SceneChoiceBg: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + S.choice[0];
  return (
    <AbsoluteFill>
      <Stage bg="#050710">
        <SeriesDefs />
        <g transform={`translate(540 960) scale(${1.75 + f * 0.0006}) translate(-540 -790)`}>
          <Yard frame={g} figure={<YardTheo g={g} x={540} y={1180} scale={1.0} />} dryAround={{x: 540, y: 1180 - 300, r: 300}} />
        </g>
      </Stage>
    </AbsoluteFill>
  );
};

const IconDoor: React.FC = () => (
  <svg viewBox="0 0 150 150" width={150} height={150}>
    <rect x={35} y={15} width={80} height={125} rx={6} fill="#3d3150" stroke="#c9b8e0" strokeWidth={5} />
    <rect x={48} y={30} width={54} height={40} rx={4} fill="none" stroke="#c9b8e0" strokeWidth={4} />
    <circle cx={100} cy={85} r={7} fill="#e9d48a" />
    <rect x={20} y={138} width={110} height={6} fill="#c9b8e0" />
  </svg>
);
const IconStation: React.FC = () => (
  <svg viewBox="0 0 150 150" width={150} height={150}>
    <path d="M 75 12 L 90 52 L 133 54 L 99 80 L 111 122 L 75 98 L 39 122 L 51 80 L 17 54 L 60 52 Z" fill="#e8c54a" stroke="#fff3c4" strokeWidth={4} />
    <circle cx={75} cy={72} r={14} fill="#b59a6a" />
  </svg>
);

/* ================================================================ chapter */
const SCENES: [readonly [number, number], React.FC][] = [
  [S.hook, SceneHook],
  [S.theoTalk, SceneTheoTalk],
  [S.secondMsg, SceneSecondMsg],
  [S.noraClose, SceneNoraClose],
  [S.theoClose, SceneTheoClose],
  [S.tower, SceneTower],
  [S.milo, SceneMilo],
  [S.drawing, SceneDrawing],
  [S.town, SceneTown],
  [S.noraPhone, SceneNoraPhone],
  [S.notif, SceneNotif],
  [S.yard, SceneYard],
  [S.echoPhone, SceneEchoPhone],
  [S.reaction, SceneReaction],
  [S.choice, SceneChoiceBg],
];

export const Chapter02: React.FC = () => {
  const frame = useCurrentFrame();
  const dip = Math.max(tween(frame, [636, 640], [0, 1]) * tween(frame, [640, 646], [1, 0]), tween(frame, [986, 990], [0, 1]) * tween(frame, [990, 994], [1, 0]));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SCENES.map(([[from, to], C], i) => (
        <Sequence key={i} from={from} durationInFrames={to - from}>
          <C />
        </Sequence>
      ))}
      <Flash opacity={dip} color="#000" />
      <Grain frame={frame} opacity={0.07} />
      <ChapterTitle at={132} chapter={2} title="THREE WEEKS" hold={70} />
      <Countdown zeroFrame={0} elapsedAtZero={ELAPSED_AT_START} show={frame >= 18 ? 1 : 0} urgent={frame >= S.yard[0]} />
      <SeriesSubtitles timeline={TL} />
      <ChoiceCard
        at={S.choice[0]}
        aAt={W('n7', 'A:')}
        bAt={W('n7', 'B:')}
        ctaAt={L('n8').start}
        voteAt={L('n8').end + 4}
        chapter={2}
        ctaText="YOU DECIDE!"
        choice={{
          question: 'The other Theo is outside. What should Nora do?',
          a: 'Open the door',
          b: 'Run to the station',
          aIcon: <IconDoor />,
          bIcon: <IconStation />,
        }}
      />
      <Audio src={staticFile('series/ch02/soundtrack.wav')} />
    </AbsoluteFill>
  );
};
