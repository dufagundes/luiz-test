import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {DURATION, FPS, HEIGHT, WIDTH} from './lib/constants';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MessageFromTomorrow"
      component={Video}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
