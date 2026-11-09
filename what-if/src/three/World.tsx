import React from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {noise, lerp} from '../lib/anim';
import type {CamState, WorldState} from '../story/types';
import {Cow} from './Cow';
import {Cashier} from './Cashier';
import {Cart} from './Cart';
import {CanDisplay, Confetti, Item, MilkCarton} from './Props';
import {Entrance, L, Store} from './Store';

const CameraRig: React.FC<{cam: CamState; t: number}> = ({cam, t}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const sh = cam.shake ?? 0;
  const j = (k: number) => noise(t * 18, k) * sh * 0.06;
  camera.position.set(cam.pos[0] + j(1), cam.pos[1] + j(2), cam.pos[2] + j(3));
  camera.up.set(0, 1, 0);
  camera.lookAt(cam.target[0] + j(4) * 0.5, cam.target[1] + j(5) * 0.5, cam.target[2]);
  if (cam.roll) camera.rotateZ(cam.roll);
  camera.fov = cam.fov;
  camera.near = 0.05;
  camera.far = 80;
  camera.updateProjectionMatrix();
  return null;
};

/** soft studio-like reflections for the plastic look (computed once per browser tab) */
const Env: React.FC = () => {
  const {gl, scene} = useThree();
  React.useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    scene.background = new THREE.Color('#fff1d6');
    pm.dispose();
  }, [gl, scene]);
  return null;
};

/** key light whose shadow frustum follows the action, so shadows stay crisp with a small shadow map */
const KeyLight: React.FC<{focus: [number, number, number]; mood: number}> = ({focus, mood}) => {
  const light = React.useMemo(() => {
    const l = new THREE.DirectionalLight('#fff4e0', 2.2);
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    const c = l.shadow.camera as THREE.OrthographicCamera;
    c.left = -4;
    c.right = 4;
    c.top = 4;
    c.bottom = -4;
    c.near = 0.5;
    c.far = 20;
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.02;
    l.shadow.radius = 4;
    return l;
  }, []);
  light.position.set(focus[0] + 2.2, 7.5, focus[2] + 3.0);
  light.target.position.set(focus[0], 0, focus[2]);
  light.target.updateMatrixWorld();
  light.intensity = lerp(2.2, 1.2, mood);
  return (
    <>
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  );
};

export const World: React.FC<{w: WorldState}> = ({w}) => {
  const focus: [number, number, number] = [w.cow.pos[0], 0, w.cow.pos[2]];
  return (
    <>
      <CameraRig cam={w.cam} t={w.t} />
      <Env />
      <hemisphereLight args={['#fffaf0', '#9fd8d0', lerp(1.25, 0.6, w.mood)]} />
      <ambientLight intensity={lerp(0.25, 0.1, w.mood)} />
      <KeyLight focus={focus} mood={w.mood} />
      {w.mood > 0.01 && <spotLight position={[w.cow.pos[0], 3.6, w.cow.pos[2] + 1.2]} angle={0.5} penumbra={0.6} intensity={w.mood * 18} color="#ffe8c2" distance={7} decay={1.5} target-position={[w.cow.pos[0], 1.2, w.cow.pos[2]]} />}
      <Store />
      <Entrance open={w.doors} />
      <CanDisplay center={L.cans} dir={[0.62, 0, 0.78]} since={w.cansSince} />
      {w.heroOnShelf && (
        <group position={L.hero}>
          <MilkCarton />
        </group>
      )}
      <Cow p={w.cow} />
      <Cashier p={w.cashier} />
      {w.cart && <Cart c={w.cart} />}
      {w.items.map((it, i) => (
        <group key={i} position={it.pos} rotation={it.rot} scale={it.scale ?? 1}>
          <Item kind={it.kind} bite={it.bite} />
        </group>
      ))}
      <Confetti since={w.confettiSince} center={[L.desk.x, 0, L.desk.z - 1]} />
    </>
  );
};
