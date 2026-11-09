import React from 'react';
import * as THREE from 'three';
import {between} from '../lib/ik';
import type {V3} from '../lib/anim';

// Shared unit geometries: every rounded part is a scaled unit sphere / cylinder, keeping draw cost low.
export const G = {
  sphere: new THREE.SphereGeometry(1, 32, 24),
  sphereLo: new THREE.SphereGeometry(1, 16, 12),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 24),
  cylLo: new THREE.CylinderGeometry(1, 1, 1, 12),
  box: new THREE.BoxGeometry(1, 1, 1),
  cone: new THREE.ConeGeometry(1, 1, 20),
  torus: new THREE.TorusGeometry(1, 0.18, 12, 40),
  halfTorus: new THREE.TorusGeometry(1, 0.2, 10, 24, Math.PI),
};

type MeshProps = {
  m: THREE.Material;
  p?: V3;
  r?: V3;
  s?: V3 | number;
  shadow?: boolean;
  geo?: THREE.BufferGeometry;
};
const sc = (s: V3 | number | undefined): V3 => (s === undefined ? [1, 1, 1] : typeof s === 'number' ? [s, s, s] : s);

export const Ball: React.FC<MeshProps> = ({m, p = [0, 0, 0], r = [0, 0, 0], s, shadow = true, geo}) => (
  <mesh geometry={geo ?? G.sphere} material={m} position={p} rotation={r} scale={sc(s)} castShadow={shadow} receiveShadow />
);
export const Cyl: React.FC<MeshProps> = ({m, p = [0, 0, 0], r = [0, 0, 0], s, shadow = true, geo}) => (
  <mesh geometry={geo ?? G.cyl} material={m} position={p} rotation={r} scale={sc(s)} castShadow={shadow} receiveShadow />
);
export const Box: React.FC<MeshProps> = ({m, p = [0, 0, 0], r = [0, 0, 0], s, shadow = true}) => (
  <mesh geometry={G.box} material={m} position={p} rotation={r} scale={sc(s)} castShadow={shadow} receiveShadow />
);

/** rounded box built from a box + edge cylinders would be costly; we use a squashed sphere-capped box instead */
export const RBox: React.FC<MeshProps & {round?: number}> = ({m, p = [0, 0, 0], r = [0, 0, 0], s, shadow = true, round = 0.04}) => {
  const [x, y, z] = sc(s);
  const geo = React.useMemo(() => roundedBox(x, y, z, Math.min(round, x / 2, y / 2, z / 2)), [x, y, z, round]);
  return <mesh geometry={geo} material={m} position={p} rotation={r} castShadow={shadow} receiveShadow />;
};

const rbCache = new Map<string, THREE.BufferGeometry>();
export function roundedBox(w: number, h: number, d: number, r: number): THREE.BufferGeometry {
  const key = `${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}:${r.toFixed(3)}`;
  const c = rbCache.get(key);
  if (c) return c;
  // extruded rounded rectangle with bevel = nice soft toy edges
  const x = -w / 2 + r;
  const y = -h / 2 + r;
  const ww = w - 2 * r;
  const hh = h - 2 * r;
  const s2 = new THREE.Shape();
  s2.moveTo(x, y);
  s2.lineTo(x + ww, y);
  s2.lineTo(x + ww, y + hh);
  s2.lineTo(x, y + hh);
  s2.lineTo(x, y);
  const g = new THREE.ExtrudeGeometry(s2, {depth: Math.max(0.0001, d - 2 * r), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 3, curveSegments: 4});
  g.translate(0, 0, -(d - 2 * r) / 2);
  g.computeVertexNormals();
  rbCache.set(key, g);
  return g;
}

/** a cylinder (with rounded joint ball) stretched between two points */
export const Limb: React.FC<{a: V3; b: V3; r: number; m: THREE.Material; joint?: boolean; jm?: THREE.Material}> = ({a, b, r, m, joint = true, jm}) => {
  const t = between(a, b);
  return (
    <>
      <mesh geometry={G.cyl} material={m} position={t.position} quaternion={t.quaternion} scale={[r, t.length, r]} castShadow receiveShadow />
      {joint && <mesh geometry={G.sphereLo} material={jm ?? m} position={b} scale={r} castShadow />}
    </>
  );
};
