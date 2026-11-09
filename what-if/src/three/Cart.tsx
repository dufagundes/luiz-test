import React from 'react';
import * as THREE from 'three';
import {V3, localToWorld} from '../lib/anim';
import {gridTexture, plastic} from './materials';
import {Ball, Cyl, G, Limb} from './shapes';
import {Item, ItemKind} from './Props';

export interface CartState {
  pos: V3;
  yaw: number; // cart front faces +Z local
  roll: number; // wobble while dragged
  wheel: number; // wheel spin (rad)
  items: ItemKind[];
}

// Tiny toy shopping cart. Local frame: +Z = front, handle at the back (-Z).
export const CART = {len: 0.74, wid: 0.5, bottom: 0.4, top: 0.74, handleZ: -0.47, handleY: 0.86};
/** world position of the handle grip (side -1..1 along the bar) */
export const cartHandle = (c: CartState, side: number): V3 => localToWorld(c.pos, c.yaw, [side * 0.16, CART.handleY, CART.handleZ]);

let basketMat: THREE.MeshPhysicalMaterial | null = null;
const basket = () => {
  if (!basketMat) {
    const t = gridTexture();
    basketMat = new THREE.MeshPhysicalMaterial({color: '#e8413c', map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.35, clearcoat: 0.6});
  }
  return basketMat;
};

const SLOTS: V3[] = [[-0.1, 0.5, 0.12], [0.1, 0.5, 0.0], [0.0, 0.5, -0.15], [-0.12, 0.52, -0.1], [0.12, 0.52, 0.18]];

export const Cart: React.FC<{c: CartState}> = ({c}) => {
  const {len, wid, bottom, top} = CART;
  const h = top - bottom;
  const chrome = plastic('#d7dde4', {rough: 0.2, coat: 1});
  const grip = plastic('#2b9348');
  const tire = plastic('#2a2a2a', {rough: 0.6});
  const panel = (p: V3, s: V3, r: V3 = [0, 0, 0]) => (
    <mesh geometry={G.box} material={basket()} position={p} scale={s} rotation={r} castShadow />
  );
  return (
    <group position={c.pos} rotation={[0, c.yaw, c.roll]}>
      {/* basket: wire panels, slightly flared */}
      {panel([0, bottom, 0], [wid - 0.04, 0.012, len - 0.04])}
      {panel([wid / 2, bottom + h / 2, 0], [0.012, h, len], [0, 0, -0.06])}
      {panel([-wid / 2, bottom + h / 2, 0], [0.012, h, len], [0, 0, 0.06])}
      {panel([0, bottom + h / 2, len / 2], [wid, h, 0.012], [0.06, 0, 0])}
      {panel([0, bottom + h / 2, -len / 2], [wid, h, 0.012], [-0.06, 0, 0])}
      {/* rim */}
      {[1, -1].map((s) => (
        <Cyl key={s} m={chrome} p={[s * (wid / 2 + 0.02), top, 0]} r={[Math.PI / 2, 0, 0]} s={[0.014, len + 0.04, 0.014]} geo={G.cylLo} />
      ))}
      {[1, -1].map((s) => (
        <Cyl key={'f' + s} m={chrome} p={[0, top, s * (len / 2 + 0.02)]} r={[0, 0, Math.PI / 2]} s={[0.014, wid + 0.06, 0.014]} geo={G.cylLo} />
      ))}
      {/* handle posts + grip bar */}
      {[1, -1].map((s) => (
        <Limb key={'h' + s} a={[s * 0.22, top, -len / 2]} b={[s * 0.22, CART.handleY, CART.handleZ]} r={0.014} m={chrome} />
      ))}
      <Cyl m={grip} p={[0, CART.handleY, CART.handleZ]} r={[0, 0, Math.PI / 2]} s={[0.026, 0.5, 0.026]} />
      {/* chassis legs + wheels */}
      {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz]) => (
        <group key={`${sx}${sz}`}>
          <Limb a={[sx * 0.2, bottom, sz * 0.28]} b={[sx * 0.2, 0.08, sz * 0.28]} r={0.013} m={chrome} joint={false} />
          <group position={[sx * 0.2, 0.06, sz * 0.28]} rotation={[c.wheel, 0, Math.PI / 2]}>
            <Cyl m={tire} s={[0.06, 0.04, 0.06]} geo={G.cylLo} />
            <Cyl m={chrome} s={[0.03, 0.045, 0.03]} geo={G.cylLo} shadow={false} />
          </group>
        </group>
      ))}
      <Ball m={chrome} p={[0, bottom - 0.02, 0]} s={[0.015, 0.015, 0.015]} shadow={false} />
      {c.items.map((k, i) => (
        <group key={i} position={SLOTS[i % SLOTS.length]}>
          <Item kind={k} />
        </group>
      ))}
    </group>
  );
};
