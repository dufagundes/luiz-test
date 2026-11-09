import {V3, add3, along, clamp, fwd, keys, keysV, localToWorld, pathLength, travel, ease, Ease, scale3} from '../lib/anim';
import {CowPose, cowRest} from '../three/Cow';
import {CartState, cartHandle} from '../three/Cart';
import {CamState} from './types';

/** walk the cow along a polyline between t0 and t1 (distance-driven stride, auto walkAmt) */
export function walk(p: CowPose, t: number, t0: number, t1: number, pts: V3[], acc = 0.2, d0 = 0): CowPose {
  const Ltot = pathLength(pts);
  const f = (tt: number) => travel(tt, t0, t1, acc) * Ltot;
  const d = f(t);
  const speed = (f(t + 0.05) - f(t - 0.05)) / 0.1;
  const a = along(pts, d);
  return {...p, pos: a.pos, yaw: a.yaw, walkDist: d0 + d, walkAmt: clamp(speed / 0.7)};
}

/** cart being pushed in front of the cow; both hooves on the handle */
export function pushCart(p: CowPose, items: CartState['items'] = []): {cow: CowPose; cart: CartState} {
  const cart: CartState = {pos: add3(p.pos, scale3(fwd(p.yaw), 0.93)), yaw: p.yaw, roll: 0, wheel: p.walkDist / 0.06, items};
  return {cow: {...p, handL: cartHandle(cart, 1), handR: cartHandle(cart, -1), lean: p.lean + 0.08}, cart};
}

/** cart dragged behind by the left hoof, wobbling */
export function dragCart(p: CowPose, t: number, items: CartState['items'] = []): {cow: CowPose; cart: CartState} {
  const wob = Math.sin(p.walkDist * 3.1) * 0.12 * p.walkAmt;
  const yaw = p.yaw + Math.PI + wob;
  // the left hoof holds the grip at cow-local (0.16, 0.86, -0.36); that grip is cart-local (-0.16, 0.86, -0.47)
  const grip = localToWorld(p.pos, p.yaw, [0.16, 0, -0.36]);
  const off = localToWorld([0, 0, 0], yaw, [-0.16, 0, -0.47]);
  const cart: CartState = {pos: [grip[0] - off[0], 0, grip[2] - off[2]], yaw, roll: Math.sin(t * 9) * 0.04 * p.walkAmt, wheel: p.walkDist / 0.06, items};
  return {cow: {...p, handL: cartHandle(cart, -1)}, cart};
}

/** quick natural blinks at the given times */
export const blink = (t: number, at: number[]) => {
  let o = 1;
  for (const b of at) {
    const d = Math.abs(t - b);
    if (d < 0.09) o = Math.min(o, d / 0.09);
  }
  return o;
};

/** chewing jaw 0..1 */
export const chew = (t: number, t0: number, t1: number, rate = 7) => (t < t0 || t > t1 ? 0 : 0.5 - 0.5 * Math.cos((t - t0) * rate * Math.PI));

export type CamKey = [number, V3, V3, number];
export function camKeys(t: number, k: CamKey[], e: Ease = ease.inOut, shake = 0): CamState {
  return {
    pos: keysV(t, k.map((x) => [x[0], x[1]] as [number, V3]), e),
    target: keysV(t, k.map((x) => [x[0], x[2]] as [number, V3]), e),
    fov: keys(t, k.map((x) => [x[0], x[3]] as [number, number]), e),
    shake,
  };
}

/** point in front of the cow's face (for held items), cow-local offset */
export const nearFace = (p: CowPose, l: V3): V3 => localToWorld(p.pos, p.yaw, l);

export {cowRest};
