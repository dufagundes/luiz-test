import React, {useMemo} from 'react';
import * as THREE from 'three';
import {buildPatch, buildSkin, skin, S} from './bomberGeometry';

export type BomberProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  /** 0 = solid, 1 = see-through x-ray of the internals */
  xray?: number;
  /** 0 = normal colours, 1 = infrared "thermal camera" look */
  thermal?: number;
  /** 0..1 how far the bay doors are open */
  bayOpen?: number;
  /** 0..1 ghost external bombs under the wings (what NOT to do) */
  external?: number;
  /** 0..1 glow of the exhaust decks */
  exhaustGlow?: number;
  /** 0..1 cyan scan-line sweeping over the skin (reveal effect) */
  scan?: number;
  opacity?: number;
  castShadow?: boolean;
};

const midY = (u: number, s: number) => (skin(u, s, 1).y + skin(u, s, -1).y) / 2;

export const Bomber: React.FC<BomberProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  xray = 0,
  thermal = 0,
  bayOpen = 0,
  external = 0,
  exhaustGlow = 0,
  scan = -1,
  opacity = 1,
  castShadow = true,
}) => {
  const geo = useMemo(() => {
    const doors: {g: THREE.BufferGeometry; pivot: THREE.Vector3; dir: number}[] = [];
    for (const side of [1, -1]) {
      // two bays, each with an inner and an outer door hinged at the bay edges
      const inner = 0.028 * side;
      const midU = 0.072 * side;
      const outer = 0.116 * side;
      for (const [a, b, hinge] of [
        [inner, midU, inner],
        [midU, outer, outer],
      ]) {
        const g = buildPatch(Math.min(a, b), Math.max(a, b), 0.4, 0.64, -1, 0.004, 6, 8);
        const pivot = skin(hinge, 0.52, -1);
        g.translate(-pivot.x, -pivot.y, -pivot.z);
        const extendsTo = Math.sign((a + b) / 2 - hinge);
        doors.push({g, pivot, dir: extendsTo});
      }
    }
    const engines: {pos: THREE.Vector3; len: number; r: number}[] = [];
    for (const u of [0.085, 0.155, -0.085, -0.155]) {
      const z0 = skin(u, 0.3, 1).z;
      const z1 = skin(u, 0.72, 1).z;
      engines.push({pos: new THREE.Vector3(u * S, midY(u, 0.5) + 0.015, (z0 + z1) / 2), len: Math.abs(z0 - z1), r: 0.075});
    }
    const pylons: THREE.Vector3[] = [];
    for (const u of [0.36, 0.52, -0.36, -0.52]) pylons.push(skin(u, 0.45, -1));
    return {
      skin: buildSkin(),
      windows: [buildPatch(-0.042, -0.006, 0.105, 0.155, 1, 0.004, 6, 6), buildPatch(0.006, 0.042, 0.105, 0.155, 1, 0.004, 6, 6)],
      intakes: [buildPatch(0.098, 0.168, 0.2, 0.255, 1, 0.006, 6, 4), buildPatch(-0.168, -0.098, 0.2, 0.255, 1, 0.006, 6, 4)],
      exhaust: [buildPatch(0.055, 0.205, 0.76, 0.95, 1, 0.004, 10, 6), buildPatch(-0.205, -0.055, 0.76, 0.95, 1, 0.004, 10, 6)],
      bays: [buildPatch(0.028, 0.116, 0.4, 0.64, -1, 0.002, 6, 8), buildPatch(-0.116, -0.028, 0.4, 0.64, -1, 0.002, 6, 8)],
      doors,
      engines,
      pylons,
      bayCenters: [skin(0.072, 0.52, -1), skin(-0.072, 0.52, -1)],
      tips: [skin(1, 0.5, 1), skin(-1, 0.5, 1)],
    };
  }, []);

  const mats = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({color: '#2a2f36', roughness: 0.42, metalness: 0.3, envMapIntensity: 0.3}),
      door: new THREE.MeshStandardMaterial({color: '#2a2f36', roughness: 0.5, metalness: 0.3, envMapIntensity: 0.3, side: THREE.DoubleSide}),
      window: new THREE.MeshStandardMaterial({color: '#0b1220', roughness: 0.08, metalness: 0.9, envMapIntensity: 2}),
      dark: new THREE.MeshStandardMaterial({color: '#101318', roughness: 0.8, metalness: 0.1}),
      exhaust: new THREE.MeshStandardMaterial({color: '#4a4740', roughness: 0.7, metalness: 0.4, emissive: new THREE.Color('#ff7a1a')}),
      bay: new THREE.MeshStandardMaterial({color: '#07090c', roughness: 1, metalness: 0}),
      engine: new THREE.MeshStandardMaterial({color: '#9aa3ad', roughness: 0.35, metalness: 0.9}),
      core: new THREE.MeshStandardMaterial({color: '#331a08', emissive: new THREE.Color('#ff5a00'), roughness: 0.6}),
      weapon: new THREE.MeshStandardMaterial({color: '#59606a', roughness: 0.45, metalness: 0.6}),
      ghost: new THREE.MeshStandardMaterial({color: '#ff3b4e', emissive: new THREE.Color('#ff1e3c'), emissiveIntensity: 0.8, transparent: true, roughness: 0.4}),
      nav: [
        new THREE.MeshBasicMaterial({color: '#ff2a2a', toneMapped: false}),
        new THREE.MeshBasicMaterial({color: '#2aff6a', toneMapped: false}),
      ],
    }),
    [],
  );

  // ---- per-frame material state
  const see = xray > 0.001;
  const skinOpacity = opacity * (1 - 0.62 * xray);
  for (const m of [mats.skin, mats.door, mats.window, mats.dark, mats.exhaust]) {
    m.transparent = see || opacity < 1;
    m.opacity = m === mats.exhaust ? opacity : skinOpacity;
    m.depthWrite = !see;
  }
  const cool = new THREE.Color('#2a2f36').lerp(new THREE.Color('#1a2b6b'), thermal);
  mats.skin.color.copy(cool);
  mats.door.color.copy(new THREE.Color('#2a2f36').lerp(new THREE.Color('#1a2b6b'), thermal));
  mats.skin.emissive.set(scan >= 0 ? '#38e1ff' : '#000000');
  mats.skin.emissiveIntensity = 0;
  mats.exhaust.emissiveIntensity = exhaustGlow * 2.2;
  mats.core.emissiveIntensity = 0.4 + 2.5 * Math.max(thermal, xray * 0.6);
  mats.ghost.opacity = external * 0.9;

  const doorAngle = bayOpen * 1.75;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo.skin} material={mats.skin} castShadow={castShadow} receiveShadow />
      {geo.windows.map((g, i) => (
        <mesh key={'w' + i} geometry={g} material={mats.window} />
      ))}
      {geo.intakes.map((g, i) => (
        <mesh key={'i' + i} geometry={g} material={mats.dark} />
      ))}
      {geo.exhaust.map((g, i) => (
        <mesh key={'e' + i} geometry={g} material={mats.exhaust} />
      ))}
      {/* open bays read as dark recesses with side walls */}
      {bayOpen > 0.01 &&
        geo.bays.map((g, i) => <mesh key={'b' + i} geometry={g} material={mats.bay} />)}
      {bayOpen > 0.01 &&
        geo.bayCenters.map((c, i) => (
          <group key={'p' + i} position={[c.x, c.y - 0.05 * bayOpen, c.z]}>
            {[-0.06, 0.06].map((dx, k) => (
              <group key={k} position={[dx, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh material={mats.weapon} castShadow>
                  <cylinderGeometry args={[0.045, 0.045, 0.62, 18]} />
                </mesh>
                <mesh material={mats.weapon} position={[0, 0.34, 0]}>
                  <coneGeometry args={[0.045, 0.1, 18]} />
                </mesh>
                <mesh material={mats.dark} position={[0, -0.3, 0]}>
                  <boxGeometry args={[0.13, 0.05, 0.01]} />
                </mesh>
              </group>
            ))}
          </group>
        ))}
      {geo.doors.map((d, i) => (
        <group key={'d' + i} position={d.pivot} rotation={[0, 0, -d.dir * doorAngle]}>
          <mesh geometry={d.g} material={mats.door} castShadow />
        </group>
      ))}
      {/* internals, visible in x-ray mode */}
      {see &&
        geo.engines.map((e, i) => (
          <group key={'n' + i} position={e.pos} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={mats.engine}>
              <cylinderGeometry args={[e.r, e.r * 0.85, e.len, 24]} />
            </mesh>
            <mesh material={mats.core} position={[0, -e.len / 2 + 0.05, 0]}>
              <cylinderGeometry args={[e.r * 0.7, e.r * 0.5, 0.12, 20]} />
            </mesh>
          </group>
        ))}
      {external > 0.01 &&
        geo.pylons.map((p, i) => (
          <group key={'x' + i} position={[p.x, p.y - 0.13, p.z]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={mats.ghost}>
              <cylinderGeometry args={[0.06, 0.06, 0.7, 16]} />
            </mesh>
            <mesh material={mats.ghost} position={[0, 0.4, 0]}>
              <coneGeometry args={[0.06, 0.12, 16]} />
            </mesh>
            <mesh material={mats.ghost} position={[0, 0.05, -0.08]}>
              <boxGeometry args={[0.03, 0.3, 0.12]} />
            </mesh>
          </group>
        ))}
      {geo.tips.map((t, i) => (
        <mesh key={'t' + i} position={[t.x, t.y, t.z]} material={mats.nav[i]}>
          <sphereGeometry args={[0.025, 10, 10]} />
        </mesh>
      ))}
    </group>
  );
};
