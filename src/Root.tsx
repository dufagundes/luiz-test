import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {DURATION, FPS, HEIGHT, WIDTH} from './lib/constants';
import {Chapter01, CH01_DURATION} from './series/chapters/ch01/Ch01';
import {CastSheet} from './series/CastSheet';
import {Chapter02, CH02_DURATION} from './series/chapters/ch02/Ch02';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Standalone short */}
      <Composition id="MessageFromTomorrow" component={Video} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />

      {/* THE LAST SIGNAL: one composition per chapter */}
      <Composition id="TLS-Ch01" component={Chapter01} durationInFrames={CH01_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="TLS-Ch02" component={Chapter02} durationInFrames={CH02_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="TLS-CastSheet" component={CastSheet} durationInFrames={30} fps={FPS} width={WIDTH} height={HEIGHT} />
    </>
  );
};
