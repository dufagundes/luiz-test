import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {DURATION, FPS, HEIGHT, WIDTH} from './lib/constants';
import {Chapter01, CH01_DURATION} from './series/chapters/ch01/Ch01';
import {CastSheet} from './series/CastSheet';
import {StealthVideo} from './stealth/StealthVideo';
import {DURATION_FRAMES as STEALTH_FRAMES} from './stealth/lib';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Standalone short */}
      <Composition id="MessageFromTomorrow" component={Video} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />

      {/* THE LAST SIGNAL: one composition per chapter */}
      <Composition id="TLS-Ch01" component={Chapter01} durationInFrames={CH01_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="TLS-CastSheet" component={CastSheet} durationInFrames={30} fps={FPS} width={WIDTH} height={HEIGHT} />

      {/* EXPLAINERS: 3D educational shorts */}
      <Composition id="Stealth-Bomber" component={StealthVideo} durationInFrames={STEALTH_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    </>
  );
};
