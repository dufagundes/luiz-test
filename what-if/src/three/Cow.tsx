import React from 'react';
import * as THREE from 'three';
import {V3, lerp, clamp} from '../lib/anim';
import {twoBone, between} from '../lib/ik';
import {plastic, spotsTexture, matte} from './materials';
import {Ball, Cyl, G, Limb, RBox} from './shapes';

/** Every animatable control of the cow. Scenes only ever set these numbers. */
export interface CowPose {
  pos: V3;
  yaw: number;
  walkDist: number; // metres travelled (drives the stride, so feet never slide)
  walkAmt: number; // 0 standing .. 1 walking
  stomp: number; // 0 normal .. 1 angry stomping gait
  lean: number; // forward lean (rad)
  roll: number;
  twist: number;
  squash: number; // + = squashed down, - = stretched up
  hop: number; // extra vertical offset (m)
  headYaw: number;
  headPitch: number; // + = look up
  headTilt: number;
  eyeOpen: number; // 0 closed .. 1 normal
  eyeScale: number; // 1 normal, 1.6 = shocked
  pupil: number; // pupil size multiplier
  look: [number, number]; // pupil direction -1..1
  brow: number; // + angry, - worried
  browY: number; // raise
  mouthOpen: number; // 0..1
  smile: number; // -1 frown .. 1 smile
  earUp: number; // 0 floppy .. 1 alert
  tail: number; // side swing (rad)
  tailUp: number; // 0 droop .. 1 raised
  handL: V3 | null; // world-space hoof targets (null = relaxed)
  handR: V3 | null;
  steam: number; // nostril steam amount 0..1
  t: number; // global time (for idle wiggles)
}

export const cowRest = (over: Partial<CowPose> = {}): CowPose => ({
  pos: [0, 0, 0], yaw: 0, walkDist: 0, walkAmt: 0, stomp: 0, lean: 0, roll: 0, twist: 0, squash: 0, hop: 0,
  headYaw: 0, headPitch: 0, headTilt: 0, eyeOpen: 1, eyeScale: 1, pupil: 1, look: [0, 0], brow: 0, browY: 0,
  mouthOpen: 0, smile: 0.6, earUp: 0.3, tail: 0, tailUp: 0, handL: null, handR: null, steam: 0, t: 0, ...over,
});

// --- proportions (cow-local metres, +Z forward, feet at y=0) ---
const HIP_Y = 0.64;
const SHOULDER: V3 = [0.33, 1.2, 0.0];
const HIP: V3 = [0.16, HIP_Y, 0.0];
const ARM = [0.29, 0.29];
const LEG = [0.31, 0.31];
const ANKLE_Y = 0.1;
export const STRIDE = 0.34; // metres a foot travels per half-cycle

const WHITE = '#fbfaf6';
const INK = '#26221f';
const PINK = '#f7a8b8';
const HOOF = '#5a4740';
export const GOLD = new THREE.MeshPhysicalMaterial({color: '#f2b632', metalness: 0.7, roughness: 0.25, clearcoat: 1});

/** body (hips-up) transform in cow-local space */
export function bodyMatrix(p: CowPose): THREE.Matrix4 {
  const walkBounce = p.walkAmt * (0.03 + 0.04 * p.stomp) * Math.abs(Math.sin((p.walkDist / (2 * STRIDE)) * Math.PI * 2));
  const sq = p.squash;
  const m = new THREE.Matrix4().makeTranslation(0, walkBounce + p.hop - sq * 0.05, 0);
  m.multiply(new THREE.Matrix4().makeTranslation(0, HIP_Y, 0));
  m.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(p.lean, p.twist, p.roll, 'YXZ')));
  m.multiply(new THREE.Matrix4().makeScale(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5));
  m.multiply(new THREE.Matrix4().makeTranslation(0, -HIP_Y, 0));
  return m;
}
const tr = (m: THREE.Matrix4, v: V3): V3 => {
  const q = new THREE.Vector3(...v).applyMatrix4(m);
  return [q.x, q.y, q.z];
};
/** world -> cow-local */
export function worldToCow(p: CowPose, w: V3): V3 {
  const dx = w[0] - p.pos[0];
  const dz = w[2] - p.pos[2];
  const c = Math.cos(p.yaw);
  const s = Math.sin(p.yaw);
  return [dx * c - dz * s, w[1] - p.pos[1], dx * s + dz * c];
}

const Arm: React.FC<{p: CowPose; side: 1 | -1; B: THREE.Matrix4}> = ({p, side, B}) => {
  const sh = tr(B, [SHOULDER[0] * side, SHOULDER[1], SHOULDER[2]]);
  const target = side === 1 ? p.handL : p.handR;
  const swing = Math.sin((p.walkDist / (2 * STRIDE)) * Math.PI * 2) * 0.13 * p.walkAmt * side;
  const tgt = target ? worldToCow(p, target) : tr(B, [0.43 * side, 0.8 + Math.sin(p.t * 1.7 + side) * 0.01, 0.06 + swing]);
  const {joint, end} = twoBone(sh, tgt, ARM[0], ARM[1], [0.7 * side, -0.4, -0.6]);
  const fore = between(joint, end);
  const spot = plastic(WHITE, {map: spotsTexture()});
  return (
    <group>
      <Ball m={spot} p={sh} s={0.1} />
      <Limb a={sh} b={joint} r={0.082} m={spot} />
      <Limb a={joint} b={end} r={0.075} m={plastic(WHITE)} joint={false} />
      <group position={end} quaternion={fore.quaternion}>
        <Cyl m={plastic(HOOF, {rough: 0.3})} p={[0, 0.02, 0]} s={[0.088, 0.08, 0.088]} />
        <Ball m={plastic(HOOF, {rough: 0.3})} p={[0, 0.06, 0]} s={[0.088, 0.03, 0.088]} />
      </group>
    </group>
  );
};

const Leg: React.FC<{p: CowPose; side: 1 | -1; B: THREE.Matrix4}> = ({p, side, B}) => {
  const hip = tr(B, [HIP[0] * side, HIP[1], HIP[2]]);
  const ph = (p.walkDist / (2 * STRIDE)) * Math.PI * 2 + (side === 1 ? 0 : Math.PI);
  const z = Math.sin(ph) * STRIDE * 0.5 * p.walkAmt;
  const lift = Math.max(0, Math.cos(ph)) * (0.07 + 0.08 * p.stomp) * p.walkAmt;
  const ankle: V3 = [0.17 * side, ANKLE_Y + lift, z];
  const {joint, end} = twoBone(hip, ankle, LEG[0], LEG[1], [0.15 * side, 0, 1]);
  const spot = plastic(WHITE, {map: spotsTexture()});
  return (
    <group>
      <Limb a={hip} b={joint} r={0.11} m={spot} />
      <Limb a={joint} b={end} r={0.095} m={plastic(WHITE)} joint={false} />
      <Cyl m={plastic(HOOF, {rough: 0.3})} p={[end[0], end[1] - 0.045, end[2] + 0.02]} s={[0.115, 0.1, 0.13]} />
    </group>
  );
};

const Eye: React.FC<{p: CowPose; side: 1 | -1}> = ({p, side}) => {
  const R = 0.085 * p.eyeScale;
  const open = clamp(p.eyeOpen, 0.06, 1.3);
  const lx = clamp(p.look[0], -1, 1) * 0.42;
  const ly = clamp(p.look[1], -1, 1) * 0.38;
  const lz = Math.sqrt(Math.max(0.1, 1 - lx * lx - ly * ly));
  const pr = 0.046 * p.pupil * (0.8 + 0.2 * p.eyeScale);
  return (
    <group position={[0.115 * side, 0.255, 0.215]} rotation={[0, side * 0.22, 0]}>
      <group scale={[1, open, 1]}>
        <Ball m={plastic('#ffffff', {rough: 0.15, coat: 1})} s={R} shadow={false} />
        <Ball m={plastic('#141414', {rough: 0.1, coat: 1})} p={[lx * R, ly * R, lz * R * 0.97]} s={[pr, pr, pr * 0.45]} shadow={false} />
        <Ball m={plastic('#ffffff', {emissive: '#ffffff', ei: 0.6})} p={[lx * R - pr * 0.35, ly * R + pr * 0.4, lz * R + 0.004]} s={pr * 0.32} shadow={false} />
      </group>
    </group>
  );
};

const Head: React.FC<{p: CowPose}> = ({p}) => {
  const white = plastic(WHITE);
  const ink = plastic(INK);
  const pink = plastic(PINK);
  const earA = lerp(-0.5, 0.55, p.earUp) + Math.sin(p.t * 3.1) * 0.03;
  const open = clamp(p.mouthOpen);
  return (
    <group position={[0, 1.36, 0.03]} rotation={[-p.headPitch, p.headYaw, p.headTilt, 'YXZ']}>
      {/* skull + head patch */}
      <Ball m={white} p={[0, 0.17, 0.02]} s={[0.3, 0.27, 0.27]} />
      <Ball m={ink} p={[0.13, 0.27, 0.1]} s={[0.15, 0.13, 0.15]} />
      {/* muzzle */}
      <Ball m={pink} p={[0, 0.03, 0.25]} s={[0.24, 0.165, 0.17]} />
      <Ball m={plastic('#c96b80')} p={[0.075, 0.085, 0.405]} r={[0, 0, 0.35]} s={[0.026, 0.038, 0.02]} shadow={false} />
      <Ball m={plastic('#c96b80')} p={[-0.075, 0.085, 0.405]} r={[0, 0, -0.35]} s={[0.026, 0.038, 0.02]} shadow={false} />
      {/* mouth: smile arc when closed, open oval with tongue when talking/shocked */}
      {open < 0.15 && (
        <mesh geometry={G.halfTorus} material={plastic('#5b2333')} position={[0, -0.035 + (p.smile < 0 ? -0.03 : 0), 0.395]}
          rotation={[0.25, 0, p.smile >= 0 ? Math.PI : 0]} scale={[0.065, Math.max(0.15, Math.abs(p.smile)) * 0.05, 0.05]} />
      )}
      {open >= 0.15 && (
        <group position={[0, -0.05, 0.36]} rotation={[0.35, 0, 0]}>
          <Ball m={plastic('#4a1626')} s={[0.1, 0.085 * open, 0.05]} shadow={false} />
          <Ball m={plastic('#ff6f91')} p={[0, -0.05 * open, 0.012]} s={[0.065, 0.03 * open, 0.04]} shadow={false} />
        </group>
      )}
      {/* eyes + brows */}
      <Eye p={p} side={1} />
      <Eye p={p} side={-1} />
      {[1, -1].map((s) => (
        <group key={s} position={[0.115 * s, 0.37 + p.browY + 0.07 * (p.eyeScale - 1), 0.27]} rotation={[-0.3, 0, s * p.brow * 0.5]}>
          <RBox m={ink} s={[0.11, 0.028, 0.03]} round={0.012} />
        </group>
      ))}
      {/* ears */}
      {[1, -1].map((s) => (
        <group key={s} position={[0.26 * s, 0.24, -0.02]} rotation={[0, 0, s * earA]}>
          <Ball m={white} p={[0.13 * s, 0, 0]} s={[0.15, 0.055, 0.085]} />
          <Ball m={pink} p={[0.14 * s, 0.002, 0.03]} s={[0.11, 0.035, 0.06]} shadow={false} />
        </group>
      ))}
      {/* horns + tuft */}
      {[1, -1].map((s) => (
        <group key={s} position={[0.14 * s, 0.4, -0.03]} rotation={[0, 0, -s * 0.55]}>
          <Cyl m={plastic('#f3e3c3')} p={[0, 0.06, 0]} s={[0.035, 0.13, 0.035]} geo={G.cylLo} />
          <Ball m={plastic('#f3e3c3')} p={[0, 0.125, 0]} s={0.035} geo={G.sphereLo} />
        </group>
      ))}
      <Ball m={plastic('#4b3426')} p={[0, 0.43, 0.06]} s={[0.07, 0.05, 0.06]} />
      <Ball m={plastic('#4b3426')} p={[0.05, 0.42, 0.09]} s={[0.04, 0.035, 0.04]} />
      <Steam p={p} />
    </group>
  );
};

/** angry little steam puffs from the nostrils */
const Steam: React.FC<{p: CowPose}> = ({p}) => {
  if (p.steam <= 0.01) return null;
  const puffs = [];
  for (let i = 0; i < 6; i++) {
    const ph = (p.t * 2.2 + i / 6) % 1;
    const side = i % 2 ? 1 : -1;
    const op = Math.round(p.steam * (1 - ph) * 0.85 * 10) / 10;
    if (op <= 0) continue;
    puffs.push(
      <mesh key={i} geometry={G.sphereLo} material={matte('#ffffff', {transparent: true, opacity: op})}
        position={[0.09 * side + side * ph * 0.2, 0.06 + ph * 0.12, 0.43 + ph * 0.18]} scale={0.03 + ph * 0.07} />,
    );
  }
  return <>{puffs}</>;
};

const Tail: React.FC<{p: CowPose}> = ({p}) => {
  const n = 6;
  const L = 0.085;
  const m = plastic(WHITE);
  let node: React.ReactNode = (
    <group position={[0, 0, -L]}>
      <Ball m={plastic(INK)} p={[0, 0, -0.04]} s={[0.05, 0.05, 0.075]} />
    </group>
  );
  for (let i = n - 1; i >= 0; i--) {
    const wave = Math.sin(p.t * 4 - i * 0.7) * 0.12;
    const droop = i === 0 ? lerp(-0.85, 0.35, p.tailUp) : lerp(-0.18, 0.1, p.tailUp);
    node = (
      <group position={[0, 0, i === 0 ? 0 : -L]} rotation={[droop, p.tail / n + wave * 0.5, 0, 'YXZ']}>
        <mesh geometry={G.cylLo} material={m} position={[0, 0, -L / 2]} rotation={[Math.PI / 2, 0, 0]} scale={[0.024, L + 0.01, 0.024]} castShadow />
        {node}
      </group>
    );
  }
  return <group position={[0, 0.86, -0.28]}>{node}</group>;
};

export const Cow: React.FC<{p: CowPose}> = ({p}) => {
  const B = bodyMatrix(p);
  const spot = plastic(WHITE, {map: spotsTexture()});
  return (
    <group position={p.pos} rotation={[0, p.yaw, 0]}>
      <group matrixAutoUpdate={false} matrix={B}>
        {/* torso: spotted pear */}
        <Ball m={spot} p={[0, 0.98, 0]} r={[0, 0.4, 0]} s={[0.36, 0.42, 0.31]} />
        <Ball m={plastic('#f9d6de')} p={[0, 0.86, 0.17]} s={[0.24, 0.24, 0.16]} />
        {/* collar + bell */}
        <mesh geometry={G.torus} material={plastic('#e63946')} position={[0, 1.3, 0.02]} rotation={[Math.PI / 2 - 0.2, 0, 0]} scale={[0.19, 0.19, 0.17]} castShadow />
        <Ball m={GOLD} p={[0, 1.215, 0.215]} s={0.055} />
        <Head p={p} />
        <Tail p={p} />
      </group>
      <Arm p={p} side={1} B={B} />
      <Arm p={p} side={-1} B={B} />
      <Leg p={p} side={1} B={B} />
      <Leg p={p} side={-1} B={B} />
    </group>
  );
};
