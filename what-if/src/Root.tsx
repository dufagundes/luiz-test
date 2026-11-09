import React from 'react';
import {Composition} from 'remotion';
import {FPS, W, H} from './lib/anim';
import {CowShopping, COW_FRAMES} from './CowShopping';
import {CowTest, TEST_FRAMES} from './CowTest';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CowTest" component={CowTest} durationInFrames={TEST_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="CowShopping" component={CowShopping} durationInFrames={COW_FRAMES} fps={FPS} width={W} height={H} defaultProps={{withAudio: true}} />
    <Composition id="CowShoppingSilent" component={CowShopping} durationInFrames={COW_FRAMES} fps={FPS} width={W} height={H} defaultProps={{withAudio: false}} />
  </>
);
