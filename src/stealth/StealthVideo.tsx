import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {sceneRange, SCENES, LineId} from './lib';
import {SceneF1, SceneF2, SceneF3, SceneF4, SceneF5, SceneHook, SceneOutro, SceneRadar, SceneTogether} from './Scenes';
import {Checklist, CutFlash, Finish, ProgressBar, RadarHUD, Subtitles} from './ui/Overlay';

const SCENE_COMPONENTS: Record<LineId, React.FC> = {
  hook: SceneHook,
  radar: SceneRadar,
  f1: SceneF1,
  f2: SceneF2,
  f3: SceneF3,
  f4: SceneF4,
  f5: SceneF5,
  together: SceneTogether,
  outro: SceneOutro,
};

/** "How a stealth bomber avoids radar" — 1080×1920, 30 fps. */
export const StealthVideo: React.FC = () => (
  <AbsoluteFill style={{background: '#05080d'}}>
    {SCENES.map((id) => {
      const {from, dur} = sceneRange(id);
      const Comp = SCENE_COMPONENTS[id];
      return (
        <Sequence key={id} from={from} durationInFrames={dur} name={id}>
          <Comp />
        </Sequence>
      );
    })}
    <Finish />
    <Checklist />
    <RadarHUD />
    <Subtitles />
    <CutFlash />
    <ProgressBar />
    <Audio src={staticFile('stealth/soundtrack.wav')} />
  </AbsoluteFill>
);
