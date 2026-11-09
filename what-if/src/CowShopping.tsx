import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {FPS, hit, seg} from './lib/anim';
import {FontGate} from './FontGate';
import {Scene3D} from './Scene3D';
import {BEAT, worldAt} from './story/cowStory';
import {Captions, Chunk} from './ui/Captions';
import {ComicWord, EndCard, Grade, HookTitle, SpeedLines} from './ui/Overlays';
import timeline from './timeline.json';

export const COW_FRAMES = Math.round(44 * FPS);

export const CowShopping: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const w = worldAt(t);
  const drama = t >= BEAT.zoom && t < BEAT.stare ? (t < BEAT.pov ? 1 : 0.6) : 0;
  const flash = 0.8 * hit(t, BEAT.shock, 0.12) + 0.7 * hit(t, BEAT.slam, 0.1) + 0.35 * hit(t, BEAT.canHit, 0.08);
  const dim = 0.55 * seg(t, BEAT.end + 0.05, BEAT.end + 0.5);
  return (
    <AbsoluteFill style={{backgroundColor: '#fff1d6'}}>
      <FontGate>
        <Scene3D w={w} />
        <SpeedLines amount={t >= BEAT.shock && t < BEAT.shock + 0.9 ? 1 - seg(t, BEAT.shock + 0.4, BEAT.shock + 0.9) : 0} t={t} />
        <Grade t={t} drama={drama} flash={flash} dim={dim} />
        <HookTitle t={t} />
        <ComicWord t={t} t0={BEAT.canHit} dur={1.0} text="CRASH!" color="#ffd21f" top={420} size={170} rot={8} />
        <ComicWord t={t} t0={BEAT.pov + 0.15} dur={1.05} text="$6.00?!" color="#ff3b3b" top={330} size={200} rot={-6} />
        <ComicWord t={t} t0={BEAT.slam} dur={1.0} text="SLAM!" color="#ffd21f" top={360} size={210} rot={-10} />
        <ComicWord t={t} t0={36.25} dur={2.0} text="MOOOOO!" color="#ffffff" top={1080} size={190} rot={-6} />
        <EndCard t={t} t0={BEAT.end} />
        <Captions t={t} chunks={(timeline as {chunks: Chunk[]}).chunks} />
      </FontGate>
      {withAudio && <Audio src={staticFile('cow-shopping/soundtrack.wav')} />}
    </AbsoluteFill>
  );
};
