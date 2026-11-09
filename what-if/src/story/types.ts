import type {V3} from '../lib/anim';
import type {CowPose} from '../three/Cow';
import type {CashierPose} from '../three/Cashier';
import type {CartState} from '../three/Cart';
import type {ItemKind} from '../three/Props';

export interface CamState {
  pos: V3;
  target: V3;
  fov: number;
  roll?: number;
  shake?: number; // 0..1
}

export interface HeldItem {
  kind: ItemKind;
  pos: V3;
  rot: V3;
  scale?: number;
  bite?: number;
}

/** Everything needed to draw one frame. Shots are just functions time -> WorldState. */
export interface WorldState {
  t: number;
  cam: CamState;
  cow: CowPose;
  cashier: CashierPose;
  cart: CartState | null;
  items: HeldItem[];
  heroOnShelf: boolean;
  doors: number;
  cansSince: number | null; // seconds since the tail hit the display
  confettiSince: number; // <0 = none
  mood: number; // 0 normal .. 1 dramatic lighting (dairy freeze)
}
