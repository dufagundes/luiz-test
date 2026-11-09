import React from 'react';
import * as THREE from 'three';
import {V3, clamp} from '../lib/anim';
import {cartonSideTexture, matte, milkLabelTexture, plastic, protestTexture, rand} from './materials';
import {Ball, Box, Cyl, G} from './shapes';

export type ItemKind = 'apple' | 'lettuce' | 'carrot' | 'carton' | 'sign' | 'can';

// --------------------------------------------------------------------------- milk carton
export const CARTON = {w: 0.16, d: 0.15, h: 0.25, gable: 0.075};
let cartonGeo: {body: THREE.BoxGeometry; roof: THREE.BufferGeometry; mats: THREE.Material[]} | null = null;
function carton() {
  if (!cartonGeo) {
    const {w, d, h, gable} = CARTON;
    const body = new THREE.BoxGeometry(w, h, d);
    body.translate(0, h / 2, 0);
    const tri = new THREE.Shape();
    tri.moveTo(-d / 2, 0);
    tri.lineTo(d / 2, 0);
    tri.lineTo(0, gable);
    tri.lineTo(-d / 2, 0);
    const roof = new THREE.ExtrudeGeometry(tri, {depth: w, bevelEnabled: false});
    roof.translate(0, 0, -w / 2);
    roof.rotateY(Math.PI / 2);
    roof.translate(0, h, 0);
    const label = new THREE.MeshPhysicalMaterial({map: milkLabelTexture(), roughness: 0.4, clearcoat: 0.5});
    const side = new THREE.MeshPhysicalMaterial({map: cartonSideTexture(), roughness: 0.4, clearcoat: 0.5});
    const white = plastic('#ffffff');
    // BoxGeometry face order: +x, -x, +y, -y, +z (front), -z (back)
    cartonGeo = {body, roof, mats: [side, side, white, white, label, label]};
  }
  return cartonGeo;
}

/** milk carton, origin at the bottom centre, label faces +Z */
export const MilkCarton: React.FC<{simple?: boolean}> = () => {
  const c = carton();
  return (
    <group>
      <mesh geometry={c.body} material={c.mats} castShadow receiveShadow />
      <mesh geometry={c.roof} material={plastic('#2f7de1')} castShadow />
      <Box m={plastic('#2f7de1')} p={[0, CARTON.h + CARTON.gable + 0.012, 0]} s={[CARTON.w, 0.028, 0.012]} />
    </group>
  );
};

// --------------------------------------------------------------------------- produce + misc
export const Apple: React.FC = () => (
  <group>
    <Ball m={plastic('#e5383b', {rough: 0.25, coat: 0.9})} s={[0.062, 0.056, 0.062]} />
    <Cyl m={plastic('#6b4423')} p={[0, 0.06, 0]} r={[0, 0, 0.2]} s={[0.006, 0.03, 0.006]} geo={G.cylLo} />
    <Ball m={plastic('#55a630')} p={[0.02, 0.07, 0]} r={[0, 0, -0.6]} s={[0.022, 0.006, 0.012]} geo={G.sphereLo} />
  </group>
);

export const Lettuce: React.FC<{bite?: number}> = ({bite = 0}) => {
  const k = 1 - 0.75 * clamp(bite);
  const lt = plastic('#8ac926', {rough: 0.5});
  const dk = plastic('#52a447', {rough: 0.5});
  return (
    <group scale={[k, k, k]}>
      <Ball m={lt} s={[0.1, 0.09, 0.1]} />
      <Ball m={dk} p={[0.05, 0.02, 0.05]} s={[0.07, 0.06, 0.05]} />
      <Ball m={dk} p={[-0.06, 0.01, 0.03]} s={[0.06, 0.06, 0.06]} />
      <Ball m={lt} p={[0.0, 0.03, -0.06]} s={[0.07, 0.06, 0.06]} />
    </group>
  );
};

export const Carrot: React.FC = () => (
  <group rotation={[0, 0, Math.PI]}>
    <mesh geometry={G.cone} material={plastic('#f77f00')} scale={[0.03, 0.17, 0.03]} castShadow />
    <Cyl m={plastic('#55a630')} p={[0, -0.1, 0]} s={[0.012, 0.06, 0.012]} geo={G.cylLo} />
  </group>
);

export const CAN = {r: 0.075, h: 0.165};
export const Can: React.FC = () => (
  <group>
    <Cyl m={plastic('#d62828', {rough: 0.3})} s={[CAN.r, CAN.h, CAN.r]} />
    <Cyl m={plastic('#fff3d6')} s={[CAN.r + 0.002, CAN.h * 0.45, CAN.r + 0.002]} shadow={false} />
    <Cyl m={plastic('#c8ccd0', {rough: 0.2})} p={[0, CAN.h / 2, 0]} s={[CAN.r * 0.95, 0.006, CAN.r * 0.95]} shadow={false} />
  </group>
);

let _sign: THREE.Material[] | null = null;
const signMats = () => {
  const w = plastic('#fff8e7');
  return (_sign ??= [w, w, w, w, new THREE.MeshStandardMaterial({map: protestTexture(), roughness: 0.6}), w]);
};

export const ProtestSign: React.FC = () => (
  <group>
    <Cyl m={plastic('#c08552')} p={[0, 0.2, 0]} s={[0.018, 0.62, 0.018]} />
    <Box m={plastic('#c08552')} p={[0, 0.58, -0.012]} s={[0.46, 0.35, 0.02]} />
    <mesh geometry={G.box} position={[0, 0.58, 0.0]} scale={[0.44, 0.33, 0.006]}
      material={signMats()} />
  </group>
);

/** item centred on its origin (carton/sign: origin at the grip) */
export const Item: React.FC<{kind: ItemKind; bite?: number}> = ({kind, bite}) => {
  switch (kind) {
    case 'apple':
      return <Apple />;
    case 'lettuce':
      return <Lettuce bite={bite} />;
    case 'carrot':
      return <Carrot />;
    case 'carton':
      return (
        <group position={[0, -CARTON.h / 2, 0]}>
          <MilkCarton />
        </group>
      );
    case 'sign':
      return <ProtestSign />;
    case 'can':
      return <Can />;
  }
};

// --------------------------------------------------------------------------- falling can display
export const PYRAMID = {base: 0.26, r: 0.42};
type CanSim = {frames: {p: V3; a: number; axis: V3}[]}[];
const simCache = new Map<string, CanSim>();

/** deterministic little physics sim: cans tumble off the pyramid, bounce, settle lying on their side */
export function simulateCans(center: V3, dir: V3): CanSim {
  const key = `${center.join()}:${dir.join()}`;
  const hit = simCache.get(key);
  if (hit) return hit;
  const R = rand(42);
  const out: CanSim = [];
  const rows = [4, 3, 2, 1];
  let idx = 0;
  rows.forEach((n, row) => {
    for (let i = 0; i < n; i++) {
      const lateral = (i - (n - 1) / 2) * (CAN.r * 2 + 0.008);
      // pyramid laid out across X (local), stacked in Y
      const p: V3 = [center[0] + lateral, PYRAMID.base + CAN.h / 2 + row * (CAN.h + 0.004), center[2]];
      const speed = 1.1 + R() * 0.9 + row * 0.25;
      const spread = (R() - 0.5) * 1.2;
      let v: V3 = [dir[0] * speed + spread * dir[2] * 0.8, 0.6 + R() * 1.4, dir[2] * speed - spread * dir[0] * 0.8];
      const axis: V3 = [-v[2], 0, v[0]];
      const al = Math.hypot(axis[0], axis[2]) || 1;
      axis[0] /= al;
      axis[2] /= al;
      let a = 0;
      let w = 6 + R() * 8;
      const delay = (3 - row) * 0.04 + R() * 0.05;
      const frames: {p: V3; a: number; axis: V3}[] = [];
      const dt = 1 / 240;
      let q: V3 = [...p];
      for (let f = 0; f < 30 * 8; f++) {
        const tf = f / 30;
        if (tf > delay) {
          for (let s = 0; s < 8; s++) {
            v = [v[0], v[1] - 9.8 * dt, v[2]];
            q = [q[0] + v[0] * dt, q[1] + v[1] * dt, q[2] + v[2] * dt];
            a += w * dt;
            const ext = Math.abs(Math.cos(a)) * (CAN.h / 2) + Math.abs(Math.sin(a)) * CAN.r;
            const onPed = Math.hypot(q[0] - center[0], q[2] - center[2]) < PYRAMID.r;
            const floor = (onPed ? PYRAMID.base : 0) + ext;
            if (q[1] < floor) {
              q[1] = floor;
              if (v[1] < 0) v[1] = -v[1] * 0.3;
              v[0] *= 0.85;
              v[2] *= 0.85;
              w *= 0.8;
              // settle onto its side
              const target = Math.round((a - Math.PI / 2) / Math.PI) * Math.PI + Math.PI / 2;
              a += (target - a) * 0.08;
            }
          }
        }
        frames.push({p: [...q] as V3, a, axis});
      }
      out[idx++] = {frames};
    }
  });
  simCache.set(key, out);
  return out;
}

export const CanDisplay: React.FC<{center: V3; dir: V3; since: number | null}> = ({center, dir, since}) => {
  const sim = simulateCans(center, dir);
  const f = since === null ? -1 : Math.min(sim[0].frames.length - 1, Math.max(0, Math.floor(since * 30)));
  return (
    <group>
      <Cyl m={plastic('#ffd166')} p={[center[0], PYRAMID.base / 2, center[2]]} s={[PYRAMID.r, PYRAMID.base, PYRAMID.r]} />
      <Cyl m={plastic('#ef476f')} p={[center[0], PYRAMID.base - 0.03, center[2]]} s={[PYRAMID.r + 0.01, 0.05, PYRAMID.r + 0.01]} shadow={false} />
      {sim.map((c, i) => {
        if (f < 0) {
          return (
            <group key={i} position={c.frames[0].p}>
              <Can />
            </group>
          );
        }
        const fr = c.frames[f];
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...fr.axis), fr.a);
        return (
          <group key={i} position={fr.p} quaternion={q}>
            <Can />
          </group>
        );
      })}
    </group>
  );
};

// --------------------------------------------------------------------------- confetti
export const Confetti: React.FC<{since: number; center: V3}> = ({since, center}) => {
  if (since < 0) return null;
  const R = rand(7);
  const cols = ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#ffffff', '#f77f00'];
  const pieces = [];
  for (let i = 0; i < 70; i++) {
    const x0 = center[0] + (R() - 0.5) * 3;
    const z0 = center[2] + (R() - 0.5) * 2.5;
    const delay = R() * 0.6;
    const fall = 0.7 + R() * 0.5;
    const tt = Math.max(0, since - delay);
    const y = Math.max(0.01, 3.9 - tt * fall - 0.0 * tt);
    const sway = Math.sin(tt * 4 + i) * 0.15;
    const m = matte(cols[i % cols.length], {rough: 0.5, side: THREE.DoubleSide});
    pieces.push(
      <mesh key={i} geometry={G.box} material={m} position={[x0 + sway, y, z0]} rotation={[tt * 5 + i, tt * 3, i]} scale={[0.05, 0.003, 0.03]} />,
    );
  }
  return <>{pieces}</>;
};
