import {V3, add3, clamp, ease, hit, keys, keysV, lerp, localToWorld, mix3, noise, seg, sub3} from '../lib/anim';
import {CowPose, cowRest} from '../three/Cow';
import {CashierPose, cashierRest} from '../three/Cashier';
import {CartState} from '../three/Cart';
import {HERO_CARTON_CENTER, L} from '../three/Store';
import {CamKey, blink, camKeys, chew, dragCart, nearFace, pushCart, walk} from './helpers';
import {HeldItem, WorldState} from './types';

const PI = Math.PI;
export const DURATION = 44.0;

// ------------------------------------------------------------------------------- story beats (seconds)
export const BEAT = {
  hook: 0,
  shopping: 3.4,
  lettuce: 6.0,
  knock: 8.2,
  canHit: 9.0,
  aisle: 10.8,
  dairy: 13.0,
  grab: 13.55,
  ots: 14.8,
  freeze: 16.0,
  zoom: 16.4,
  shock: 16.5,
  pov: 19.4,
  stare: 20.6,
  turn: 22.2,
  cashierPeek: 24.3,
  march: 25.4,
  marchSide: 28.0,
  desk: 30.6,
  slam: 31.05,
  cashierClose: 33.0,
  sign: 34.2,
  moo: 35.8,
  end: 39.4,
};

export interface Shot {
  name: string;
  t0: number;
  t1: number;
  fn: (t: number) => Partial<WorldState> & {cam: WorldState['cam']; cow: CowPose};
}

// ------------------------------------------------------------------------------- shared bits
const CASH: V3 = [L.desk.x, 0, 6.72];
const PRODUCE_SPOT: V3 = [-3.78, 0, 1.75];
const PARKED_PRODUCE: CartState = {pos: [-3.62, 0, 0.82], yaw: -PI / 2, roll: 0, wheel: 0, items: []};
const DAIRY_SPOT: V3 = [0.45, 0, -7.98];
const READ_SPOT: V3 = [0.45, 0, -7.72];
const DESK_SPOT: V3 = [L.desk.x, 0, 5.28];
const BASKET: CartState['items'] = ['apple', 'carrot', 'apple'];

const cashierIdle = (t: number, over: Partial<CashierPose> = {}): CashierPose =>
  cashierRest({
    pos: CASH,
    yaw: PI,
    t,
    handL: [0.12, 1.1, 6.3],
    handR: [0.68, 1.1 + Math.max(0, Math.sin(t * 5)) * 0.03, 6.25],
    headYaw: -0.25 + noise(t * 0.4, 3) * 0.15,
    headPitch: -0.25,
    eyeOpen: blink(t, [1.3, 4.1, 7.7, 11.2, 14.9, 18.3, 21.6, 25.9, 29.4]),
    ...over,
  });

/** a carton held by the RIGHT hoof: hoof grips the carton's side; label faces the cow unless told otherwise */
const cartonInRight = (cow: CowPose, hand: V3, labelToCow = true): HeldItem => ({
  kind: 'carton',
  pos: add3(hand, localToWorld([0, 0, 0], cow.yaw, [0.085, 0, 0])),
  rot: [0, labelToCow ? cow.yaw + PI : cow.yaw, 0],
});

const happyWalk = (t: number): Partial<CowPose> => ({
  smile: 1,
  eyeOpen: 0.85 * blink(t, [1.6, 2.9]),
  brow: -0.15,
  earUp: 0.45 + Math.sin(t * 6) * 0.05,
  headPitch: 0.06 + Math.sin(t * 8.4) * 0.03,
  headTilt: Math.sin(t * 4.2) * 0.06,
  tail: Math.sin(t * 5) * 0.5,
});

// ------------------------------------------------------------------------------- shots
export const SHOTS: Shot[] = [
  {
    // 0 - 3.4  HOOK: confident cow strolls through the automatic doors pushing a tiny cart
    name: 'entrance',
    t0: 0,
    t1: BEAT.shopping,
    fn: (t) => {
      let cow = cowRest({t, ...happyWalk(t)});
      cow = walk(cow, t, -0.9, 3.6, [[L.door.x, 0, 12.6], [L.door.x, 0, 6.6]], 0.15);
      const {cow: c2, cart} = pushCart(cow, []);
      return {
        cow: c2,
        cart,
        doors: seg(t, 0.0, 0.55, ease.out),
        cam: camKeys(t, [
          [0, [-2.7, 0.6, 5.0], [L.door.x, 1.25, 10.0], 52],
          [3.4, [-2.8, 0.55, 4.2], [L.door.x, 1.3, 7.2], 50],
        ]),
      };
    },
  },
  {
    // 3.4 - 6.0  picks an apple, sniffs it, tosses it into the cart
    name: 'apple',
    t0: BEAT.shopping,
    t1: BEAT.lettuce,
    fn: (t) => {
      let cow = cowRest({t, pos: PRODUCE_SPOT, yaw: -PI / 2, smile: 1, earUp: 0.4, tail: Math.sin(t * 3) * 0.3});
      const restL = nearFace(cow, [0.43, 0.8, 0.06]);
      const pick: V3 = [-4.36, 1.05, 2.2];
      const nose = nearFace(cow, [0.06, 1.42, 0.52]);
      const toss = nearFace(cow, [-0.05, 1.3, 0.45]);
      cow.lean = keys(t, [[3.4, 0], [3.95, 0.3], [4.15, 0.3], [4.65, 0.04]]);
      cow.handL = keysV(t, [[3.4, restL], [3.95, pick], [4.15, pick], [4.65, nose], [5.2, nose], [5.4, toss], [5.75, restL]]);
      cow.headPitch = keys(t, [[3.4, 0], [3.9, -0.4], [4.2, -0.3], [4.6, 0.05], [5.3, 0.05], [5.6, -0.15], [6, 0]]);
      cow.headYaw = keys(t, [[3.4, 0], [3.9, 0.3], [4.6, 0.1], [5.4, -0.4], [6, -0.2]]);
      cow.headTilt = keys(t, [[4.6, 0], [4.8, 0.2], [5.2, 0.2], [5.4, 0]]);
      cow.eyeOpen = t > 4.75 && t < 5.2 ? 0.08 : blink(t, [3.6]);
      cow.look = [0, t < 4.6 ? -0.5 : 0];
      cow.mouthOpen = t > 4.7 && t < 5.2 ? 0.2 : 0;
      const items: HeldItem[] = [];
      const cart = {...PARKED_PRODUCE, items: t > 5.72 ? (['apple'] as CartState['items']) : []};
      if (t >= 4.15 && t < 5.4) items.push({kind: 'apple', pos: add3(cow.handL, [0, 0.04, 0]), rot: [0, 0, 0]});
      if (t >= 5.4 && t <= 5.72) {
        const slot = localToWorld(cart.pos, cart.yaw, [-0.1, 0.5, 0.12]);
        const u = clamp((t - 5.4) / 0.32);
        const p = mix3(toss, slot, u);
        p[1] += Math.sin(u * PI) * 0.35;
        items.push({kind: 'apple', pos: p, rot: [u * 8, u * 5, 0]});
      }
      return {
        cow,
        cart,
        items,
        cam: camKeys(t, [
          [3.4, [-4.95, 1.8, 3.45], [-3.95, 1.15, 1.9], 44],
          [6.0, [-4.85, 1.75, 3.25], [-3.95, 1.2, 1.9], 40],
        ]),
      };
    },
  },
  {
    // 6.0 - 8.2  close-up: suspicious of the lettuce... then eats it right there in the store
    name: 'lettuce',
    t0: BEAT.lettuce,
    t1: BEAT.knock,
    fn: (t) => {
      const cow = cowRest({t, pos: PRODUCE_SPOT, yaw: -PI / 2, earUp: 0.35});
      const bites = [7.0, 7.35, 7.7];
      const lunge = bites.reduce((a, b) => a + Math.exp(-Math.pow((t - b) / 0.06, 2)), 0);
      const held = nearFace(cow, [-0.04, 1.36, 0.6 - lunge * 0.07]);
      cow.handR = add3(held, localToWorld([0, 0, 0], cow.yaw, [-0.06, -0.08, -0.02]));
      const suspicious = t < 6.9;
      cow.eyeOpen = suspicious ? 0.5 : t < 8.0 ? 0.12 : 1;
      cow.brow = suspicious ? 0.45 : -0.2;
      cow.look = suspicious ? [-0.1, -0.35] : [0, 0];
      cow.headTilt = suspicious ? keys(t, [[6, 0], [6.4, 0.22], [6.8, -0.12]]) : 0.08;
      cow.headPitch = keys(t, [[6, -0.12], [6.9, -0.05], [7.0, 0.05], [8.2, 0.08]]);
      cow.smile = suspicious ? -0.25 : 1;
      cow.mouthOpen = t > 6.95 ? 0.15 + chew(t, 6.95, 8.2, 6) * 0.45 : 0;
      cow.earUp = suspicious ? 0.35 : 0.55 + Math.sin(t * 14) * 0.05;
      cow.tail = Math.sin(t * 6) * (suspicious ? 0.1 : 0.6);
      const bite = keys(t, [[6.98, 0], [7.04, 0.33], [7.33, 0.33], [7.39, 0.62], [7.68, 0.62], [7.74, 0.9]], ease.linear);
      const items: HeldItem[] = t < 7.95 ? [{kind: 'lettuce', pos: held, rot: [0.2, t * 0.2, 0], bite}] : [];
      return {
        cow,
        cart: {...PARKED_PRODUCE, items: ['apple']},
        items,
        cam: camKeys(t, [
          [6.0, [-5.55, 1.72, 2.05], [-4.1, 1.42, 1.76], 40],
          [8.2, [-5.45, 1.7, 2.0], [-4.1, 1.44, 1.76], 34],
        ]),
      };
    },
  },
  {
    // 8.2 - 10.8  wide: she turns to leave, her tail whips the can pyramid, awkward freeze, tiptoes away
    name: 'knock',
    t0: BEAT.knock,
    t1: BEAT.aisle,
    fn: (t) => {
      let cow = cowRest({t, pos: PRODUCE_SPOT, yaw: -PI / 2});
      cow.yaw = keys(t, [[8.5, -PI / 2], [BEAT.canHit, -2.25], [9.5, -4.25]], ease.inOut);
      cow.tail = keys(t, [[8.5, 0], [8.85, 1.1], [BEAT.canHit, 1.4], [9.25, -0.4], [9.8, 0.1]]);
      const shock = seg(t, 9.05, 9.2, ease.outBack) * (1 - seg(t, 9.6, 10.0));
      cow.eyeScale = 1 + 0.4 * shock;
      cow.pupil = 1 - 0.4 * shock;
      cow.earUp = 0.4 + 0.6 * shock;
      cow.squash = -0.06 * shock;
      cow.smile = t < 9.05 ? 1 : keys(t, [[9.05, -0.6], [9.6, -0.6], [9.9, 0.7]]);
      cow.mouthOpen = t > 9.05 && t < 9.55 ? 0.35 : 0;
      cow.brow = t < 9.05 ? 0 : -0.7;
      cow.headYaw = keys(t, [[9.4, 0], [9.9, -0.95], [10.25, -0.95], [10.5, 0]]);
      cow.look = [t > 9.5 && t < 10.3 ? -0.8 : 0, 0];
      cow.eyeOpen = blink(t, [8.4]);
      if (t > 10.25) {
        cow = walk(cow, t, 10.25, 11.4, [PRODUCE_SPOT, [-2.6, 0, 1.0]], 0.25);
        cow.lean = 0.18;
        cow.headYaw = 0;
      }
      return {
        cow,
        cart: {...PARKED_PRODUCE, items: ['apple']},
        cam: camKeys(t, [
          [8.2, [-5.4, 1.75, 5.2], [-3.3, 0.75, 1.95], 50],
          [10.8, [-5.25, 1.7, 4.9], [-3.2, 0.75, 1.9], 46],
        ], ease.inOut, hit(t, BEAT.canHit, 0.3)),
      };
    },
  },
  {
    // 10.8 - 13.0  "But then..." - down aisle 3 towards the glowing dairy section
    name: 'aisle',
    t0: BEAT.aisle,
    t1: BEAT.dairy,
    fn: (t) => {
      let cow = cowRest({t, ...happyWalk(t)});
      cow = walk(cow, t, 10.2, 12.6, [[L.aisleX, 0, -2.4], [L.aisleX, 0, -5.0]], 0.3);
      const wow = seg(t, 12.1, 12.5, ease.outBack);
      cow.eyeScale = 1 + 0.18 * wow;
      cow.pupil = 1 + 0.35 * wow;
      cow.mouthOpen = 0.3 * wow;
      cow.earUp = 0.45 + 0.5 * wow;
      cow.headPitch = 0.05 + 0.12 * wow;
      cow.brow = -0.15 - 0.5 * wow;
      cow.smile = 1 - wow * 0.6;
      const {cow: c2, cart} = pushCart(cow, BASKET);
      return {
        cow: c2,
        cart,
        mood: 0.15 * wow,
        cam: camKeys(t, [
          [10.8, [0.62, 0.8, -6.9], [L.aisleX, 1.3, -3.4], 50],
          [13.0, [0.58, 0.9, -7.9], [L.aisleX, 1.5, -5.0], 46],
        ]),
      };
    },
  },
  {
    // 13.0 - 14.8  grabs a milk carton, steps back and turns to read it
    name: 'grab',
    t0: BEAT.dairy,
    t1: BEAT.ots,
    fn: (t) => {
      const turn = seg(t, 13.7, 14.4);
      const cow = cowRest({t, pos: mix3(DAIRY_SPOT, READ_SPOT, turn), yaw: lerp(PI, PI / 2, turn), smile: 1, earUp: 0.6});
      cow.walkDist = turn * 0.5;
      cow.walkAmt = Math.sin(turn * PI) * 0.5;
      cow.lean = keys(t, [[13.0, 0.05], [13.45, 0.34], [13.6, 0.3], [14.0, 0]]);
      const grip = add3(HERO_CARTON_CENTER, [0.085, 0, 0]);
      const hold = nearFace(cow, [-0.2, 1.5, 0.42]);
      const restR = nearFace(cowRest({pos: DAIRY_SPOT, yaw: PI}), [-0.43, 0.8, 0.06]);
      cow.handR = t < 13.6 ? keysV(t, [[13.0, restR], [13.45, grip], [13.6, grip]]) : mix3(grip, hold, seg(t, 13.6, 14.3));
      cow.headPitch = keys(t, [[13, 0.05], [13.4, -0.15], [14.2, -0.2], [14.8, -0.25]]);
      cow.look = [0, t > 14.2 ? -0.5 : -0.2];
      cow.eyeOpen = blink(t, [13.2]);
      cow.tail = Math.sin(t * 6) * 0.6;
      const items: HeldItem[] = [];
      if (t >= 13.6) {
        const it = cartonInRight(cow, cow.handR);
        // while lifting from the shelf, the carton keeps the shelf orientation until she turns
        it.rot = [0, lerp(0, cow.yaw + PI, turn) + (turn > 0 ? 0 : 0), 0];
        items.push(it);
      }
      return {
        cow,
        cart: {pos: [-0.65, 0, -7.55], yaw: PI / 2 + 0.3, roll: 0, wheel: 0, items: BASKET},
        items,
        heroOnShelf: t < 13.6,
        mood: 0.15,
        cam: camKeys(t, [
          [13.0, [2.5, 1.55, -8.3], [0.45, 1.4, -8.15], 56],
          [14.8, [2.45, 1.58, -8.15], [0.6, 1.4, -7.85], 50],
        ]),
      };
    },
  },
];

// reading pose shared by the dairy shots after she turns (facing +X, carton up in the right hoof)
const reader = (t: number, holdLocal: V3 = [-0.2, 1.5, 0.42]) => {
  const cow = cowRest({t, pos: READ_SPOT, yaw: PI / 2, earUp: 0.6});
  cow.handR = nearFace(cow, holdLocal);
  return cow;
};
const DAIRY_CART: CartState = {pos: [-0.65, 0, -7.55], yaw: PI / 2 + 0.3, roll: 0, wheel: 0, items: BASKET};
const shockFace = (cow: CowPose, t: number, t0: number) => {
  const k = seg(t, t0, t0 + 0.35, ease.outElastic);
  cow.eyeScale = 1 + 0.75 * k;
  cow.pupil = 1 - 0.5 * k;
  cow.earUp = 0.5 + 0.5 * k;
  cow.brow = -0.9 * k;
  cow.browY = 0.04 * k;
  cow.mouthOpen = 0.95 * seg(t, t0 + 0.3, t0 + 0.6, ease.outBack);
  cow.smile = -1;
  cow.squash = -0.08 * k;
  cow.headPitch = 0.08 * k;
  // trembling pupils
  cow.look = [noise(t * 30, 1) * 0.12 * k, -0.1 + noise(t * 30, 2) * 0.12 * k];
};

SHOTS.push(
  {
    // 14.8 - 16.4  over-the-shoulder: she reads the label... and freezes
    name: 'label',
    t0: BEAT.ots,
    t1: BEAT.zoom,
    fn: (t) => {
      const tf = Math.min(t, BEAT.freeze); // everything stops at the freeze
      const cow = reader(tf);
      cow.headPitch = -0.28;
      cow.look = [0, -0.6];
      cow.eyeOpen = blink(tf, [15.3]);
      cow.smile = keys(tf, [[14.8, 1], [15.7, 0.2], [16.0, 0]]);
      cow.tail = 0.3 * Math.sin(tf * 5);
      const carton = cartonInRight(cow, cow.handR!);
      const look = carton.pos;
      return {
        cow,
        cart: DAIRY_CART,
        items: [carton],
        heroOnShelf: false,
        mood: lerp(0.15, 0.6, seg(t, 15.9, 16.3)),
        cam: camKeys(t, [
          [14.8, nearFace(cow, [-0.58, 2.35, -0.3]), add3(look, [0, 0.01, 0]), 36],
          [16.0, nearFace(cow, [-0.56, 2.3, -0.26]), add3(look, [0, 0.0, 0]), 28],
          [16.4, nearFace(cow, [-0.56, 2.3, -0.25]), add3(look, [0, 0.0, 0]), 27.5],
        ]),
      };
    },
  },
  {
    // 16.4 - 19.4  DRAMATIC SNAP ZOOM into her face. Bass hit. Total shock.
    name: 'shock',
    t0: BEAT.zoom,
    t1: BEAT.pov,
    fn: (t) => {
      const cow = reader(t, [-0.24, 1.36, 0.42]);
      cow.handR = nearFace(cow, [-0.24, 1.36 + 0.02 * Math.sin(t * 40) * seg(t, 16.6, 17), 0.42]);
      if (t < BEAT.shock) {
        cow.headPitch = -0.28;
        cow.look = [0, -0.6];
        cow.smile = 0;
      } else shockFace(cow, t, BEAT.shock);
      cow.headPitch += keys(t, [[18.6, 0], [19.4, -0.2]]);
      const face = nearFace(cow, [0, 1.68, 0.2]);
      const zoom = seg(t, 16.4, 16.62, ease.outCubic);
      return {
        cow,
        cart: DAIRY_CART,
        items: [cartonInRight(cow, cow.handR!)],
        heroOnShelf: false,
        mood: 1,
        cam: {
          pos: add3(face, [lerp(1.7, 1.55, seg(t, 16.6, 19.4)), 0.02, 0.06]),
          target: face,
          fov: lerp(52, 30, zoom) - 3 * seg(t, 16.7, 19.4),
          shake: 0.5 * hit(t, BEAT.shock, 0.5) + 0.06,
        },
      };
    },
  },
  {
    // 19.4 - 20.6  POV: the price sticker
    name: 'pov',
    t0: BEAT.pov,
    t1: BEAT.stare,
    fn: (t) => {
      const cow = reader(t, [-0.12, 1.42, 0.5]);
      shockFace(cow, t, BEAT.shock);
      const carton = cartonInRight(cow, cow.handR!);
      // insert: the back label faces us; the $6.00 sticker sits lower-right as we look at it
      const sticker = add3(carton.pos, [0, -0.065, -0.045]);
      const eye = add3(carton.pos, [0.75, 0.08, 0.05]);
      const z = seg(t, 19.55, 19.85, ease.outCubic);
      return {
        cow,
        cart: DAIRY_CART,
        items: [carton],
        heroOnShelf: false,
        mood: 0.6,
        cam: {pos: mix3(eye, add3(eye, [-0.2, -0.1, -0.05]), z), target: mix3(carton.pos, sticker, z), fov: lerp(36, 16, z), shake: 0.25 * hit(t, 19.55, 0.4)},
      };
    },
  },
  {
    // 20.6 - 22.2  she slowly looks up... straight into the camera.  "Six dollars?!"
    name: 'stare',
    t0: BEAT.stare,
    t1: BEAT.turn,
    fn: (t) => {
      const cow = reader(t, [-0.3, 1.45, 0.3]);
      cow.headPitch = keys(t, [[20.6, -0.25], [21.0, 0.0]]);
      cow.look = [0, keys(t, [[20.6, -0.6], [20.95, 0]])];
      cow.eyeOpen = 0.6 + (t > 21.05 && t < 21.5 ? 0.12 * Math.sin((t - 21.05) * 60) : 0);
      cow.brow = 0.3;
      cow.smile = -0.35;
      cow.earUp = 0.3;
      cow.tail = 0;
      const face = nearFace(cow, [0, 1.6, 0.2]);
      return {
        cow,
        cart: DAIRY_CART,
        items: [cartonInRight(cow, cow.handR!)],
        heroOnShelf: false,
        mood: 0.35,
        cam: {pos: add3(face, [keys(t, [[20.6, 1.9], [22.2, 1.6]]), 0.0, 0.0]), target: add3(face, [0, -0.02, 0]), fov: 26},
      };
    },
  },
  {
    // 22.2 - 24.3  "...and she's not even getting royalties?" - slowly turns her head down the aisle
    name: 'turn',
    t0: BEAT.turn,
    t1: BEAT.cashierPeek,
    fn: (t) => {
      const cow = reader(t, [-0.32, 1.25, 0.25]);
      const k = seg(t, 22.5, 23.9, ease.inOutCubic);
      cow.headYaw = -1.15 * k;
      cow.twist = -0.35 * k;
      cow.brow = 0.3 + 0.7 * k;
      cow.eyeOpen = 0.6 - 0.1 * k;
      cow.look = [-0.6 * k, 0];
      cow.smile = -0.4 - 0.5 * k;
      cow.earUp = 0.3 - 0.3 * k;
      cow.steam = seg(t, 23.6, 24.0);
      const head = nearFace(cow, [0, 1.6, 0]);
      return {
        cow,
        cart: DAIRY_CART,
        items: [cartonInRight(cow, cow.handR!)],
        heroOnShelf: false,
        mood: 0.35,
        cam: camKeys(t, [
          [22.2, [1.0, 1.55, -5.7], head, 40],
          [24.3, [0.85, 1.58, -6.1], head, 33],
        ]),
      };
    },
  },
  {
    // 24.3 - 25.4  telephoto: the cashier, far away, senses danger
    name: 'peek',
    t0: BEAT.cashierPeek,
    t1: BEAT.march,
    fn: (t) => {
      const cow = reader(t);
      const cashier = cashierIdle(t, {
        headPitch: keys(t, [[24.3, -0.25], [24.6, 0]]),
        headYaw: keys(t, [[24.3, -0.25], [24.6, 0]]),
        eyeScale: 1 + 0.3 * seg(t, 24.6, 24.75, ease.outBack),
        pupil: 0.7,
        smile: -0.3,
        mouthOpen: t > 24.85 && t < 25.05 ? 0.3 : 0,
        sweat: seg(t, 24.7, 24.9),
        brow: 1,
        eyeOpen: 1,
      });
      return {
        cow,
        cashier,
        cart: DAIRY_CART,
        heroOnShelf: false,
        cam: {pos: [L.aisleX, 1.62, -5.6], target: [L.aisleX, 1.66, CASH[2]], fov: lerp(7.5, 5.5, seg(t, 24.3, 25.4)), shake: 0.04},
      };
    },
  },
  {
    // 25.4 - 28.0  ANGRY MARCH (front, low): dragging the cart, steam from the nostrils
    name: 'march',
    t0: BEAT.march,
    t1: BEAT.marchSide,
    fn: (t) => {
      let cow = cowRest({t, stomp: 1, brow: 1, eyeOpen: 0.62, earUp: 0, smile: -0.9, steam: 1, tailUp: 0.8, tail: Math.sin(t * 9) * 0.5});
      cow = walk(cow, t, 25.1, 28.3, [[L.aisleX, 0, -7.4], [L.aisleX, 0, -1.6]], 0.1);
      cow.lean = 0.16;
      cow.headPitch = -0.12;
      cow.handR = nearFace(cow, [-0.42, 1.12 + 0.05 * Math.sin(cow.walkDist * 9), 0.22]);
      const {cow: c2, cart} = dragCart(cow, t, BASKET);
      const camZ = c2.pos[2] + 2.5;
      return {
        cow: c2,
        cart,
        items: [cartonInRight(c2, c2.handR!, false)],
        heroOnShelf: false,
        cam: {pos: [L.aisleX + 0.25, 0.45, camZ], target: [L.aisleX, 1.2, c2.pos[2]], fov: 54, shake: 0.12},
      };
    },
  },
  {
    // 28.0 - 30.6  march, side tracking, arriving at customer service
    name: 'marchSide',
    t0: BEAT.marchSide,
    t1: BEAT.desk,
    fn: (t) => {
      let cow = cowRest({t, stomp: 1, brow: 1, eyeOpen: 0.62, earUp: 0, smile: -0.9, steam: 1, tailUp: 0.8, tail: Math.sin(t * 9) * 0.5});
      cow = walk(cow, t, 27.8, 30.55, [[L.aisleX, 0, -0.2], [L.aisleX, 0, DESK_SPOT[2]]], 0.22);
      cow.lean = 0.16 * cow.walkAmt;
      cow.handR = nearFace(cow, [-0.42, 1.12 + 0.05 * Math.sin(cow.walkDist * 9), 0.22]);
      const {cow: c2, cart} = dragCart(cow, t, BASKET);
      const cashier = cashierIdle(t, {sweat: 0.8, eyeScale: 1.15, smile: 0.4, headPitch: 0, headYaw: 0, brow: 0.6});
      return {
        cow: c2,
        cart,
        cashier,
        items: [cartonInRight(c2, c2.handR!, false)],
        heroOnShelf: false,
        cam: {pos: [-1.75, 1.1, c2.pos[2] + 1.1], target: [L.aisleX, 1.2, c2.pos[2] + 0.25], fov: 50, shake: 0.08},
      };
    },
  },
);

// at the desk: the cow faces +Z, cart left behind her
const deskCow = (t: number) => {
  const cow = cowRest({t, pos: DESK_SPOT, yaw: 0, brow: 0.9, eyeOpen: 0.65, earUp: 0.1, smile: -0.7, steam: 0.5, tailUp: 0.6, tail: Math.sin(t * 6) * 0.4});
  return cow;
};
const COUNTER_CARTON: HeldItem = {kind: 'carton', pos: [0.3, L.desk.h + 0.025 + 0.125, 5.84], rot: [0, 0.15, 0]};
const deskCart = (cow: CowPose, t: number) => dragCart({...cow, walkAmt: 0}, t, BASKET).cart;

SHOTS.push(
  {
    // 30.6 - 33.0  SLAM! milk on the counter.  "Congratulations."
    name: 'slam',
    t0: BEAT.desk,
    t1: BEAT.cashierClose,
    fn: (t) => {
      const cow = deskCow(t);
      const s = BEAT.slam;
      const held = nearFace(cow, [-0.42, 1.12, 0.22]);
      const high = nearFace(cow, [-0.2, 1.95, 0.3]);
      const onCounter = sub3(COUNTER_CARTON.pos, localToWorld([0, 0, 0], cow.yaw, [0.085, 0, 0]));
      const rest = nearFace(cow, [-0.25, 1.12, 0.42]);
      cow.handR = t < s ? keysV(t, [[30.6, held], [30.92, high], [s, onCounter]], ease.inCubic) : keysV(t, [[s, onCounter], [31.7, onCounter], [32.1, rest]]);
      cow.lean = keys(t, [[30.6, 0], [30.92, -0.12], [s, 0.28], [31.5, 0.18], [32.2, 0.1]]);
      cow.squash = 0.08 * hit(t, s, 0.12);
      cow.headPitch = keys(t, [[30.6, 0.1], [s, -0.12], [31.5, -0.05]]);
      cow.mouthOpen = t > 30.85 && t < 31.3 ? 0.4 : 0;
      const recoil = hit(t, s, 0.18);
      const cashier = cashierIdle(t, {
        headPitch: 0,
        headYaw: 0,
        hop: 0.07 * recoil,
        lean: 0.15 * seg(t, s, s + 0.15) * (1 - 0.3 * seg(t, 32, 33)),
        eyeScale: t < s ? 1.1 : 1.45,
        pupil: t < s ? 1 : 0.55,
        brow: 1,
        smile: t < s ? 0.6 : -0.2,
        mouthOpen: t < s ? 0 : 0.55 * seg(t, s + 0.1, s + 0.4),
        sweat: 1,
        handL: t < s ? [0.12, 1.1, 6.3] : keysV(t, [[s, [0.12, 1.1, 6.3]], [s + 0.15, [0.2, 1.45, 6.5]]]),
        handR: t < s ? [0.68, 1.1, 6.25] : keysV(t, [[s, [0.68, 1.1, 6.25]], [s + 0.15, [0.6, 1.45, 6.5]]]),
        eyeOpen: blink(t, [32.4]),
      });
      const items: HeldItem[] = t < s ? [cartonInRight(cow, cow.handR, false)] : [COUNTER_CARTON];
      return {
        cow,
        cashier,
        cart: deskCart(cow, t),
        items,
        heroOnShelf: false,
        cam: camKeys(t, [
          [30.6, [-1.55, 1.62, 6.3], [L.desk.x, 1.35, 5.7], 52],
          [33.0, [-1.45, 1.6, 6.35], [L.desk.x, 1.4, 5.75], 48],
        ], ease.inOut, 0.9 * hit(t, s, 0.28)),
      };
    },
  },
  {
    // 33.0 - 34.2  the cashier: total disbelief
    name: 'cashier',
    t0: BEAT.cashierClose,
    t1: BEAT.sign,
    fn: (t) => {
      const cow = deskCow(t);
      const cashier = cashierIdle(t, {
        headPitch: -0.08,
        headYaw: 0,
        lean: 0.1,
        eyeScale: 1.45,
        pupil: 0.5,
        brow: 1,
        smile: -0.3,
        mouthOpen: 0.6,
        sweat: 1,
        eyeOpen: t > 33.55 && t < 33.85 ? 0.08 : 1,
        handL: [0.2, 1.42, 6.5],
        handR: [0.6, 1.42, 6.5],
        headTilt: keys(t, [[33.0, 0], [34.2, 0.12]]),
      });
      return {
        cow,
        cashier,
        cart: deskCart(cow, t),
        items: [COUNTER_CARTON],
        heroOnShelf: false,
        cam: camKeys(t, [
          [33.0, [1.05, 1.74, 5.45], [L.desk.x, 1.7, CASH[2]], 46],
          [34.2, [1.02, 1.74, 5.6], [L.desk.x, 1.71, CASH[2]], 42],
        ]),
      };
    },
  },
  {
    // 34.2 - 35.8  the cow produces a protest sign: PAY THE COW!
    name: 'sign',
    t0: BEAT.sign,
    t1: BEAT.moo,
    fn: (t) => {
      const cow = deskCow(t);
      cow.lean = 0.12;
      cow.brow = 0.6;
      cow.smile = 0.5;
      cow.eyeOpen = 0.72;
      cow.headTilt = 0.15;
      cow.steam = 0;
      const pop = seg(t, 34.4, 34.7, ease.outBack);
      cow.handL = nearFace(cow, [0.36, lerp(0.95, 1.3, pop), 0.28]);
      const items: HeldItem[] = [COUNTER_CARTON];
      if (t > 34.4) items.push({kind: 'sign', pos: add3(cow.handL, [0, -0.17, 0.02]), rot: [0, -0.15, 0.08], scale: Math.max(0.01, pop)});
      const cashier = cashierIdle(t, {headPitch: -0.05, headYaw: 0, lean: 0.06, eyeScale: 1.3, pupil: 0.6, brow: 1, smile: -0.2, mouthOpen: 0.35, sweat: 1, handL: [0.2, 1.42, 6.5], handR: [0.6, 1.42, 6.5]});
      return {
        cow,
        cashier,
        cart: deskCart(cow, t),
        items,
        heroOnShelf: false,
        cam: camKeys(t, [
          [34.2, [0.95, 1.95, 7.45], [0.5, 1.6, 5.3], 38],
          [35.8, [0.92, 1.92, 7.25], [0.5, 1.6, 5.3], 35],
        ]),
      };
    },
  },
  {
    // 35.8 - 39.4  VICTORIOUS MOO, confetti, low hero angle
    name: 'moo',
    t0: BEAT.moo,
    t1: BEAT.end,
    fn: (t) => victory(t, camKeys(t, [
      [35.8, [-0.75, 0.5, 3.45], [L.desk.x, 1.5, DESK_SPOT[2]], 48],
      [39.4, [1.45, 0.6, 3.5], [L.desk.x, 1.6, DESK_SPOT[2]], 42],
    ], ease.inOut, t > 36.2 && t < 38 ? 0.35 : 0.05)),
  },
  {
    // 39.4 - 44.0  END: crane up and away while she celebrates
    name: 'end',
    t0: BEAT.end,
    t1: DURATION,
    fn: (t) => victory(t, camKeys(t, [
      [39.4, [L.desk.x, 2.0, 2.3], [L.desk.x, 1.25, 5.4], 52],
      [44.0, [L.desk.x - 0.3, 3.3, 0.9], [L.desk.x, 1.0, 5.4], 50],
    ])),
  },
);

function victory(t: number, cam: WorldState['cam']) {
  const cow = cowRest({t, pos: DESK_SPOT, yaw: -2.5, earUp: 1, tailUp: 1, tail: Math.sin(t * 12) * 0.7});
  const moo = seg(t, 36.15, 36.35) * (1 - seg(t, 37.9, 38.2));
  const crouch = seg(t, 35.8, 36.1) * (1 - seg(t, 36.1, 36.25));
  cow.squash = 0.12 * crouch - 0.07 * moo;
  cow.headPitch = 0.55 * moo + (t > 38.2 ? 0.1 : 0);
  cow.mouthOpen = moo > 0.05 ? 0.65 + 0.35 * moo + 0.05 * Math.sin(t * 30) : 0;
  cow.eyeOpen = moo > 0.3 ? 0.1 : 0.9 * blink(t, [39.1, 41.6]);
  cow.smile = 1;
  cow.brow = -0.3;
  cow.hop = t > 38.2 ? Math.abs(Math.sin((t - 38.2) * 6.5)) * 0.07 : 0;
  cow.walkDist = t > 38.2 ? (t - 38.2) * 0.5 : 0;
  cow.walkAmt = t > 38.2 ? 0.35 : 0;
  const up = seg(t, 35.9, 36.3, ease.outBack);
  cow.handL = nearFace(cow, [0.38, lerp(1.25, 1.75, up) + 0.04 * Math.sin(t * 7), 0.22]);
  cow.handR = nearFace(cow, [-0.4, lerp(0.9, 1.8, up) + (t > 36.3 ? 0.08 * Math.sin(t * 9) : 0), 0.15]);
  const items: HeldItem[] = [
    COUNTER_CARTON,
    {kind: 'sign', pos: add3(cow.handL, [0, -0.17, 0]), rot: [0, cow.yaw, Math.sin(t * 7) * 0.12], scale: 1},
  ];
  const clap = t > 36.9 ? Math.abs(Math.sin((t - 36.9) * 7)) : 1;
  const cashier = cashierIdle(t, {
    headPitch: 0, headYaw: 0.1, eyeScale: 1.2, pupil: 0.8, brow: 0.7, smile: 0.5, sweat: 0.7, mouthOpen: 0,
    handL: [L.desk.x - 0.04 - 0.1 * clap, 1.38, 6.45], handR: [L.desk.x + 0.04 + 0.1 * clap, 1.38, 6.45],
  });
  return {
    cow,
    cashier,
    cart: {pos: [1.55, 0, 4.7], yaw: -0.6, roll: 0, wheel: 0, items: BASKET} as CartState,
    items,
    heroOnShelf: false,
    confettiSince: t - 36.3,
    cam,
  };
}

// ------------------------------------------------------------------------------- evaluation
export function shotAt(t: number): Shot {
  return SHOTS.find((s) => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];
}

export function worldAt(t: number): WorldState {
  const s = shotAt(t);
  const r = s.fn(t);
  return {
    t,
    cashier: cashierIdle(t),
    cart: null,
    items: [],
    heroOnShelf: t < BEAT.grab,
    doors: t < 4 ? seg(t, 0, 0.55, ease.out) : 1 - seg(t, 4, 5),
    cansSince: t >= BEAT.canHit ? t - BEAT.canHit : null,
    confettiSince: -1,
    mood: 0,
    ...r,
    cam: r.cam,
    cow: {...r.cow, t},
  };
}
