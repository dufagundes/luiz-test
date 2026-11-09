import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {W, H} from './lib/anim';
import {World} from './three/World';
import type {WorldState} from './story/types';

export const Scene3D: React.FC<{w: WorldState; scale?: number}> = ({w}) => (
  <ThreeCanvas
    width={W}
    height={H}
    shadows={{type: THREE.PCFSoftShadowMap}}
    gl={{antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'}}
    camera={{fov: 50, position: [0, 1.5, 5], near: 0.05, far: 80}}
    dpr={1}
  >
    <World w={w} />
  </ThreeCanvas>
);
