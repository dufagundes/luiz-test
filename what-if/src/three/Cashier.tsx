import React from 'react';
import {V3, clamp} from '../lib/anim';
import {twoBone} from '../lib/ik';
import {plastic, matte} from './materials';
import {Ball, Box, Cyl, G, Limb, RBox} from './shapes';
import {worldToCow} from './Cow';

export interface CashierPose {
  pos: V3;
  yaw: number;
  hop: number;
  lean: number; // + leans back (recoil)
  headYaw: number;
  headPitch: number;
  headTilt: number;
  eyeOpen: number;
  eyeScale: number;
  pupil: number;
  look: [number, number];
  brow: number; // + worried raise
  mouthOpen: number;
  smile: number;
  sweat: number; // 0..1
  handL: V3 | null;
  handR: V3 | null;
  t: number;
}
export const cashierRest = (over: Partial<CashierPose> = {}): CashierPose => ({
  pos: [0, 0, 0], yaw: Math.PI, hop: 0, lean: 0, headYaw: 0, headPitch: 0, headTilt: 0, eyeOpen: 1, eyeScale: 1, pupil: 1,
  look: [0, 0], brow: 0, mouthOpen: 0, smile: 0.7, sweat: 0, handL: null, handR: null, t: 0, ...over,
});

const SKIN = '#f1c27d';
const SHIRT = '#2ec4b6';
const HAIR = '#5c3d2e';

export const Cashier: React.FC<{p: CashierPose}> = ({p}) => {
  const skin = plastic(SKIN, {rough: 0.5, coat: 0.3});
  const shirt = plastic(SHIRT);
  const hair = plastic(HAIR, {rough: 0.5});
  const ink = plastic('#222222');
  const breathe = Math.sin(p.t * 2.2) * 0.008;
  // in local frame (pos/yaw), +Z forward
  const torsoTop = 1.38 + p.hop + breathe;
  const local = (w: V3) => worldToCow({pos: p.pos, yaw: p.yaw} as never, w);
  const arm = (side: 1 | -1) => {
    const sh: V3 = [0.25 * side, torsoTop - 0.06, -p.lean * 0.25];
    const tgt = (side === 1 ? p.handL : p.handR) ?? null;
    const rest: V3 = [0.33 * side, torsoTop - 0.55, 0.08];
    const {joint, end} = twoBone(sh, tgt ? local(tgt) : rest, 0.28, 0.27, [0.6 * side, -0.5, -0.6]);
    return (
      <group key={side}>
        <Ball m={shirt} p={sh} s={0.085} />
        <Limb a={sh} b={joint} r={0.07} m={shirt} />
        <Limb a={joint} b={end} r={0.058} m={skin} joint={false} />
        <Ball m={skin} p={end} s={0.075} />
      </group>
    );
  };
  const R = 0.062 * p.eyeScale;
  const open = clamp(p.eyeOpen, 0.06, 1.3);
  const mo = clamp(p.mouthOpen);
  return (
    <group position={p.pos} rotation={[0, p.yaw, 0]}>
      {/* legs (mostly hidden by the counter) */}
      {[1, -1].map((s) => (
        <group key={s}>
          <Limb a={[0.11 * s, 0.85 + p.hop, 0]} b={[0.11 * s, 0.1, 0]} r={0.085} m={plastic('#264653')} joint={false} />
          <RBox m={plastic('#333333')} p={[0.11 * s, 0.05, 0.05]} s={[0.13, 0.1, 0.24]} round={0.04} />
        </group>
      ))}
      <group position={[0, p.hop, 0]} rotation={[-p.lean, 0, 0]}>
        {/* torso + apron + name tag */}
        <Ball m={shirt} p={[0, 1.1, 0]} s={[0.28, 0.4, 0.22]} />
        <Ball m={plastic('#f4a261')} p={[0, 1.0, 0.07]} s={[0.24, 0.3, 0.17]} />
        <RBox m={plastic('#ffffff')} p={[0.11, 1.27, 0.2]} r={[-0.25, 0, 0]} s={[0.1, 0.05, 0.02]} round={0.008} />
        <Box m={plastic('#e63946')} p={[0.11, 1.285, 0.211]} r={[-0.25, 0, 0]} s={[0.1, 0.012, 0.004]} shadow={false} />
        {/* neck + head */}
        <Cyl m={skin} p={[0, 1.48, 0]} s={[0.07, 0.12, 0.07]} geo={G.cylLo} />
        <group position={[0, 1.55, 0]} rotation={[-p.headPitch, p.headYaw, p.headTilt, 'YXZ']}>
          <Ball m={skin} p={[0, 0.17, 0]} s={[0.22, 0.24, 0.21]} />
          {/* hair: cap + side puffs + bun */}
          <Ball m={hair} p={[0, 0.25, -0.03]} s={[0.235, 0.2, 0.22]} />
          <Ball m={hair} p={[0, 0.39, -0.06]} s={0.09} />
          <Ball m={hair} p={[0.17, 0.18, -0.05]} s={[0.07, 0.12, 0.1]} />
          <Ball m={hair} p={[-0.17, 0.18, -0.05]} s={[0.07, 0.12, 0.1]} />
          <Ball m={hair} p={[0.06, 0.32, 0.14]} r={[0, 0, 0.6]} s={[0.12, 0.05, 0.07]} />
          {/* ears + nose */}
          <Ball m={skin} p={[0.215, 0.15, 0]} s={[0.035, 0.055, 0.035]} />
          <Ball m={skin} p={[-0.215, 0.15, 0]} s={[0.035, 0.055, 0.035]} />
          <Ball m={plastic('#e7a96a')} p={[0, 0.13, 0.21]} s={[0.035, 0.03, 0.03]} />
          {/* eyes + glasses */}
          {[1, -1].map((s) => (
            <group key={s} position={[0.075 * s, 0.2, 0.175]}>
              <group scale={[1, open, 1]}>
                <Ball m={plastic('#ffffff', {rough: 0.15, coat: 1})} s={R} shadow={false} />
                <Ball m={ink} p={[p.look[0] * R * 0.4, p.look[1] * R * 0.4, R * 0.92]} s={[0.032 * p.pupil, 0.032 * p.pupil, 0.012]} shadow={false} />
              </group>
              <mesh geometry={G.torus} material={plastic('#9b2226')} position={[0, 0, 0.045]} scale={[0.075 * Math.max(1, p.eyeScale * 0.95), 0.075 * Math.max(1, p.eyeScale * 0.95), 0.06]} />
              <RBox m={ink} p={[0, 0.11 + 0.04 * (p.eyeScale - 1) + p.brow * 0.03, 0.04]} r={[0, 0, s * p.brow * 0.35]} s={[0.075, 0.02, 0.02]} round={0.008} />
            </group>
          ))}
          <Box m={plastic('#9b2226')} p={[0, 0.2, 0.225]} s={[0.04, 0.012, 0.012]} shadow={false} />
          {/* mouth */}
          {mo < 0.12 ? (
            <mesh geometry={G.halfTorus} material={plastic('#7a2e2e')} position={[0, 0.06, 0.2]} rotation={[0.2, 0, p.smile >= 0 ? Math.PI : 0]}
              scale={[0.045, Math.max(0.2, Math.abs(p.smile)) * 0.035, 0.03]} />
          ) : (
            <Ball m={plastic('#4a1626')} p={[0, 0.045, 0.195]} s={[0.045, 0.06 * mo, 0.03]} shadow={false} />
          )}
          {/* sweat drop */}
          {p.sweat > 0.02 && (
            <group position={[0.2, 0.3 - (1 - p.sweat) * 0.05, 0.1]} scale={p.sweat}>
              <Ball m={matte('#9bdcff', {rough: 0.1, transparent: true, opacity: 0.85})} s={[0.035, 0.045, 0.03]} shadow={false} />
              <mesh geometry={G.cone} material={matte('#9bdcff', {rough: 0.1, transparent: true, opacity: 0.85})} position={[0, 0.05, 0]} scale={[0.03, 0.05, 0.026]} />
            </group>
          )}
        </group>
      </group>
      {arm(1)}
      {arm(-1)}
    </group>
  );
};
