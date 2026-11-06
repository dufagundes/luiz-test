import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SCENES} from './lib/constants';
import {tween} from './lib/anim';
import {Flash, Grain} from './components/Effects';
import {Subtitles} from './components/Subtitles';
import {S1Hook} from './scenes/S1Hook';
import {S2Message} from './scenes/S2Message';
import {S3Knock} from './scenes/S3Knock';
import {S4Window} from './scenes/S4Window';
import {S5Handle} from './scenes/S5Handle';
import {S6Door} from './scenes/S6Door';
import {S7Reveal} from './scenes/S7Reveal';

const SCENE_LIST = [
  {key: 's1', C: S1Hook},
  {key: 's2', C: S2Message},
  {key: 's3', C: S3Knock},
  {key: 's4', C: S4Window},
  {key: 's5', C: S5Handle},
  {key: 's6', C: S6Door},
  {key: 's7', C: S7Reveal},
] as const;

/** Short dips to black between some scenes (frame where the cut happens, half-length) */
const DIPS = [
  {at: SCENES.s2.from, half: 3},
  {at: SCENES.s3.from, half: 6},
  {at: SCENES.s4.from, half: 2},
];

const Transitions: React.FC = () => {
  const f = useCurrentFrame();
  let black = 0;
  for (const d of DIPS) {
    black = Math.max(black, tween(f, [d.at - d.half, d.at], [0, 1]) * tween(f, [d.at, d.at + d.half], [1, 0]));
  }
  // fade in from black over the first 2 frames (keeps the hook instant)
  black = Math.max(black, tween(f, [0, 2], [1, 0]));
  return <Flash opacity={black} color="#000" />;
};

export const Video: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SCENE_LIST.map(({key, C}) => {
        const s = SCENES[key];
        return (
          <Sequence key={key} from={s.from} durationInFrames={s.to - s.from} name={key}>
            <C />
          </Sequence>
        );
      })}
      <Transitions />
      <Grain frame={f} opacity={0.07} />
      <Subtitles hideAfter={866} />
      <Audio src={staticFile('soundtrack.wav')} />
    </AbsoluteFill>
  );
};
