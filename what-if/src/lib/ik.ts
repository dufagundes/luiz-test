import * as THREE from 'three';
import type {V3} from './anim';

const v = (p: V3) => new THREE.Vector3(p[0], p[1], p[2]);

/**
 * Analytic two-bone IK. Returns the elbow/knee position so that root->joint has length a,
 * joint->end has length b and end is as close to target as possible. `pole` hints the bend direction.
 */
export function twoBone(root: V3, target: V3, a: number, b: number, pole: V3): {joint: V3; end: V3} {
  const R = v(root);
  const T = v(target);
  const d = T.clone().sub(R);
  let L = d.length();
  const dir = L > 1e-6 ? d.clone().divideScalar(L) : new THREE.Vector3(0, -1, 0);
  L = Math.min(Math.max(L, Math.abs(a - b) + 1e-4), a + b - 1e-4);
  const cosA = (a * a + L * L - b * b) / (2 * a * L);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const p = v(pole);
  const n = p.sub(dir.clone().multiplyScalar(p.dot(dir)));
  if (n.lengthSq() < 1e-8) n.set(0, 0, 1);
  n.normalize();
  const J = R.clone().add(dir.clone().multiplyScalar(a * cosA)).add(n.multiplyScalar(a * sinA));
  const E = R.clone().add(dir.multiplyScalar(L));
  return {joint: [J.x, J.y, J.z], end: [E.x, E.y, E.z]};
}

const UP = new THREE.Vector3(0, 1, 0);
/** transform for a unit Y-aligned shape (height 1, centered) stretched between two points */
export function between(a: V3, b: V3): {position: V3; quaternion: THREE.Quaternion; length: number} {
  const A = v(a);
  const B = v(b);
  const d = B.clone().sub(A);
  const length = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, length > 1e-6 ? d.normalize() : UP);
  const m = A.add(B).multiplyScalar(0.5);
  return {position: [m.x, m.y, m.z], quaternion: q, length};
}
