import React from 'react';
import * as THREE from 'three';
import {V3} from '../lib/anim';
import {floorTexture, glow, matte, plastic, productTexture, rand, signTexture, skyTexture} from './materials';
import {Ball, Box, Cyl, G, RBox} from './shapes';
import {CARTON, MilkCarton} from './Props';

// ------------------------------------------------------------------ layout (metres, +Z = towards the entrance)
export const L = {
  door: {x: -3.2, z: 9, w: 2.6, h: 2.7},
  produce: {x: -4.6, z: 1.5},
  cans: [-2.95, 0, 2.3] as V3,
  aisleX: 0.4,
  shelfL: -1.25,
  shelfR: 2.05,
  shelfZ0: 1.8,
  shelfZ1: -6.8,
  fridgeFront: -8.4,
  back: -9.2,
  hero: [0.62, 1.265, -8.6] as V3, // bottom-centre of the milk carton she grabs
  desk: {x: 0.4, z: 6.0, h: 1.05, w: 2.2, d: 0.7},
  ceiling: 4.2,
};

// ------------------------------------------------------------------ instancing helper
type Inst = {p: V3; s: V3; r?: V3; c: string};
const Instanced: React.FC<{geo: THREE.BufferGeometry; mat: THREE.Material; items: Inst[]; shadow?: boolean}> = ({geo, mat, items, shadow = false}) => {
  const mesh = React.useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    const o = new THREE.Object3D();
    items.forEach((it, i) => {
      o.position.set(...it.p);
      o.rotation.set(...(it.r ?? [0, 0, 0]));
      o.scale.set(...it.s);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, new THREE.Color(it.c));
    });
    m.castShadow = shadow;
    m.receiveShadow = true;
    m.instanceMatrix.needsUpdate = true;
    return m;
  }, [geo, mat, items, shadow]);
  return <primitive object={mesh} />;
};

const PALETTE = ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#f78c3b', '#8e7dff', '#7bd389', '#ff9f1c', '#4cc9f0'];

const Sign: React.FC<{text: string; p: V3; w: number; h: number; bg: string; fg: string; r?: V3; sub?: string; hang?: number}> = ({text, p, w, h, bg, fg, r = [0, 0, 0], sub, hang}) => {
  const t = signTexture(text, bg, fg, 1024, Math.round((1024 * h) / w), sub ? 150 : 170, sub);
  const face = React.useMemo(() => new THREE.MeshStandardMaterial({map: t, roughness: 0.5}), [t]);
  const edge = plastic(bg);
  return (
    <group position={p} rotation={r}>
      <mesh geometry={G.box} scale={[w, h, 0.06]} material={[edge, edge, edge, edge, face, face]} castShadow />
      {hang && [1, -1].map((s) => <Cyl key={s} m={plastic('#9aa5ad')} p={[s * w * 0.4, h / 2 + hang / 2, 0]} s={[0.01, hang, 0.01]} geo={G.cylLo} shadow={false} />)}
    </group>
  );
};

// ------------------------------------------------------------------ shelving aisle
const ShelfRun: React.FC<{x: number; face: 1 | -1; z0: number; z1: number; seed: number}> = ({x, face, z0, z1, seed}) => {
  const len = z0 - z1;
  const zc = (z0 + z1) / 2;
  const frame = plastic('#f1f3f5', {rough: 0.5});
  const accent = plastic('#ef476f');
  const boards = [0.16, 0.6, 1.04, 1.48];
  const {boxes, cyls} = React.useMemo(() => {
    const R = rand(seed);
    const boxes: Inst[] = [];
    const cyls: Inst[] = [];
    for (const by of boards) {
      let z = z1 + 0.1;
      while (z < z0 - 0.15) {
        const kind = R();
        const c = PALETTE[Math.floor(R() * PALETTE.length)];
        const n = 2 + Math.floor(R() * 3); // a "facing" of identical products
        for (let k = 0; k < n && z < z0 - 0.15; k++) {
          if (kind < 0.6) {
            const w = 0.14;
            const h = 0.22 + (Math.floor(c.charCodeAt(2)) % 3) * 0.05;
            boxes.push({p: [x + face * 0.06, by + 0.02 + h / 2, z + w / 2], s: [0.24, h, w], c});
            z += w + 0.02;
          } else {
            const rr = 0.05;
            const h = 0.18 + (c.charCodeAt(3) % 3) * 0.05;
            cyls.push({p: [x + face * 0.1, by + 0.02 + h / 2, z + rr], s: [rr, h, rr], c});
            z += rr * 2 + 0.025;
          }
        }
        z += 0.03;
      }
    }
    return {boxes, cyls};
  }, [x, face, z0, z1, seed]);
  const label = React.useMemo(() => new THREE.MeshStandardMaterial({map: productTexture(1), roughness: 0.45, color: '#ffffff'}), []);
  return (
    <group>
      <Box m={frame} p={[x - face * 0.27, 1.0, zc]} s={[0.06, 2.0, len]} />
      <Box m={accent} p={[x, 0.07, zc]} s={[0.6, 0.14, len]} />
      {boards.slice(1).map((y) => (
        <group key={y}>
          <Box m={frame} p={[x, y, zc]} s={[0.6, 0.035, len]} shadow={false} />
          <Box m={plastic('#ffd166')} p={[x + face * 0.3, y - 0.02, zc]} s={[0.012, 0.06, len]} shadow={false} />
        </group>
      ))}
      <Box m={frame} p={[x, 2.0, zc]} s={[0.6, 0.04, len]} shadow={false} />
      {[z0, z1].map((z) => (
        <Box key={z} m={plastic('#118ab2')} p={[x, 1.0, z]} s={[0.62, 2.04, 0.06]} />
      ))}
      <Instanced geo={G.box} mat={label} items={boxes} />
      <Instanced geo={G.cylLo} mat={plastic('#ffffff', {rough: 0.3})} items={cyls} />
    </group>
  );
};

// ------------------------------------------------------------------ produce stand
const Crate: React.FC<{p: V3; tilt: number; children?: React.ReactNode}> = ({p, tilt, children}) => {
  const wood = plastic('#d9a066', {rough: 0.7, coat: 0.1});
  return (
    <group position={p} rotation={[0, 0, tilt]}>
      <Box m={wood} p={[0, 0, 0]} s={[0.55, 0.03, 0.7]} />
      <Box m={wood} p={[0.28, 0.07, 0]} s={[0.03, 0.16, 0.72]} />
      <Box m={wood} p={[-0.28, 0.07, 0]} s={[0.03, 0.16, 0.72]} />
      <Box m={wood} p={[0, 0.07, 0.36]} s={[0.58, 0.16, 0.03]} />
      <Box m={wood} p={[0, 0.07, -0.36]} s={[0.58, 0.16, 0.03]} />
      {children}
    </group>
  );
};

const ProduceStand: React.FC = () => {
  const {x, z} = L.produce;
  const fruit = React.useMemo(() => {
    const R = rand(11);
    const apples: Inst[] = [];
    const greens: Inst[] = [];
    const oranges: Inst[] = [];
    for (let i = 0; i < 5; i++)
      for (let j = 0; j < 6; j++) {
        const px = -0.2 + i * 0.1;
        const pz = -0.27 + j * 0.105;
        apples.push({p: [px, 0.08 + R() * 0.02, pz], s: [0.058, 0.053, 0.058], c: R() > 0.15 ? '#e5383b' : '#ffba08'});
        oranges.push({p: [px, 0.08 + R() * 0.02, pz], s: [0.055, 0.055, 0.055], c: '#f77f00'});
      }
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 4; j++) greens.push({p: [-0.16 + i * 0.16, 0.1, -0.24 + j * 0.16], s: [0.09, 0.08, 0.09], c: R() > 0.5 ? '#8ac926' : '#6aa832'});
    return {apples, greens, oranges};
  }, []);
  const fruitMat = plastic('#ffffff', {rough: 0.25, coat: 0.9});
  return (
    <group position={[x, 0, z]}>
      {/* table */}
      <RBox m={plastic('#8d5a3b', {rough: 0.6, coat: 0.1})} p={[0, 0.42, 0]} s={[1.0, 0.84, 2.6]} round={0.05} />
      <Crate p={[0.05, 0.9, 0.85]} tilt={0.22}>
        <Instanced geo={G.sphereLo} mat={fruitMat} items={fruit.apples} shadow />
      </Crate>
      <Crate p={[0.05, 0.9, 0.05]} tilt={0.22}>
        <Instanced geo={G.sphereLo} mat={fruitMat} items={fruit.greens} shadow />
      </Crate>
      <Crate p={[0.05, 0.9, -0.8]} tilt={0.22}>
        <Instanced geo={G.sphereLo} mat={fruitMat} items={fruit.oranges} shadow />
      </Crate>
      <Sign text="FRESH PRODUCE" p={[-0.9, 2.75, 0]} r={[0, Math.PI / 2, 0]} w={2.4} h={0.55} bg="#2b9348" fg="#ffffff" />
      {/* price stakes */}
      {[0.85, 0.05, -0.8].map((zz, i) => (
        <group key={zz} position={[0.52, 1.0, zz]} rotation={[0, Math.PI / 2, 0]}>
          <Sign text={['$1', '$2', '$1'][i]} p={[0, 0.12, 0]} w={0.22} h={0.15} bg="#ffffff" fg="#d62828" />
        </group>
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ dairy fridge
const Dairy: React.FC = () => {
  const x0 = -1.8;
  const x1 = 2.6;
  const xc = (x0 + x1) / 2;
  const w = x1 - x0;
  const zb = L.back;
  const zf = L.fridgeFront;
  const zc = (zb + zf) / 2;
  const shelves = [0.45, 0.85, 1.25, 1.65];
  const stock = React.useMemo(() => {
    const R = rand(3);
    const cartons: V3[] = [];
    const yog: Inst[] = [];
    const cheese: Inst[] = [];
    for (let xx = x0 + 0.15; xx < x1 - 0.1; xx += 0.2) {
      for (const dz of [0, -0.22]) {
        if (Math.abs(xx - L.hero[0]) < 0.08 && dz === 0) continue; // the hero carton lives here
        cartons.push([xx, 1.265, -8.6 + dz]);
        cartons.push([xx, 0.865, -8.6 + dz]);
      }
      yog.push({p: [xx, 0.465 + 0.06, -8.62], s: [0.06, 0.12, 0.06], c: R() > 0.5 ? '#ff99c8' : '#fcf6bd'});
      yog.push({p: [xx + 0.08, 0.465 + 0.06, -8.62], s: [0.06, 0.12, 0.06], c: R() > 0.5 ? '#a9def9' : '#e4c1f9'});
      cheese.push({p: [xx, 1.665 + 0.05, -8.62], s: [0.09, 0.1, 0.09], c: '#ffd166'});
    }
    return {cartons, yog, cheese};
  }, []);
  const white = plastic('#f8f9fa', {rough: 0.4});
  return (
    <group>
      <Box m={glow('#e6f6ff', 1.05)} p={[xc, 1.2, zb + 0.02]} s={[w, 1.9, 0.02]} shadow={false} />
      <Box m={white} p={[xc, 0.12, zc]} s={[w, 0.24, 0.8]} />
      {[x0, x1].map((xx) => (
        <Box key={xx} m={white} p={[xx, 1.2, zc]} s={[0.08, 2.4, 0.8]} />
      ))}
      {shelves.map((y) => (
        <group key={y}>
          <Box m={plastic('#dfe7ee', {rough: 0.25})} p={[xc, y, zc + 0.1]} s={[w, 0.03, 0.62]} shadow={false} />
          <Box m={plastic('#2f7de1')} p={[xc, y - 0.03, zf + 0.005]} s={[w, 0.05, 0.015]} shadow={false} />
        </group>
      ))}
      {/* canopy + sign */}
      <Box m={plastic('#2f7de1')} p={[xc, 2.3, zc + 0.05]} s={[w + 0.1, 0.25, 0.9]} />
      <Box m={glow('#ffffff', 1.3)} p={[xc, 2.16, zf + 0.1]} s={[w - 0.2, 0.03, 0.12]} shadow={false} />
      <Sign text="DAIRY" p={[xc, 2.9, zf + 0.1]} w={2.6} h={0.75} bg="#ffffff" fg="#2f7de1" />
      {stock.cartons.map((p, i) => (
        <group key={i} position={p}>
          <MilkCarton />
        </group>
      ))}
      <Instanced geo={G.cylLo} mat={plastic('#ffffff', {rough: 0.3})} items={stock.yog} />
      <Instanced geo={G.cylLo} mat={plastic('#ffffff', {rough: 0.4})} items={stock.cheese} />
      {/* shelf price tag under the hero carton */}
      <Sign text="$6.00" p={[L.hero[0], 1.235, zf + 0.02]} w={0.2} h={0.08} bg="#ffd21f" fg="#d62828" />
      <pointLight position={[xc, 1.4, zf + 0.6]} color="#cfeeff" intensity={4} distance={4} decay={2} />
    </group>
  );
};

// ------------------------------------------------------------------ customer service desk
const Desk: React.FC = () => {
  const {x, z, h, w, d} = L.desk;
  return (
    <group position={[x, 0, z]}>
      <RBox m={plastic('#118ab2')} p={[0, h / 2 - 0.02, 0]} s={[w, h - 0.04, d]} round={0.05} />
      <Box m={plastic('#ffd166')} p={[0, h * 0.62, -d / 2 - 0.005]} s={[w - 0.1, 0.1, 0.012]} shadow={false} />
      <RBox m={plastic('#f6e7cb', {rough: 0.5})} p={[0, h, 0]} s={[w + 0.1, 0.05, d + 0.12]} round={0.02} />
      {/* register */}
      <group position={[0.65, h + 0.025, 0.08]} rotation={[0, Math.PI, 0]}>
        <RBox m={plastic('#495057')} p={[0, 0.07, 0]} s={[0.36, 0.14, 0.3]} round={0.03} />
        <RBox m={plastic('#343a40')} p={[0, 0.25, -0.06]} r={[-0.3, 0, 0]} s={[0.26, 0.17, 0.03]} round={0.012} />
        <Box m={glow('#7cf5c8', 0.9)} p={[0, 0.25, -0.044]} r={[-0.3, 0, 0]} s={[0.22, 0.13, 0.005]} shadow={false} />
      </group>
      {/* service bell */}
      <group position={[-0.55, h + 0.025, -0.15]}>
        <Cyl m={plastic('#343a40')} p={[0, 0.01, 0]} s={[0.07, 0.02, 0.07]} />
        <Ball m={plastic('#c9cdd2', {rough: 0.15, coat: 1})} p={[0, 0.02, 0]} s={[0.055, 0.05, 0.055]} />
      </group>
      <Sign text="CUSTOMER SERVICE" p={[0, 3.05, 0.2]} r={[0, Math.PI, 0]} w={2.4} h={0.5} bg="#ef476f" fg="#ffffff" hang={0.6} />
      <Sign text="CUSTOMER SERVICE" p={[0, 3.05, 0.14]} w={2.4} h={0.5} bg="#ef476f" fg="#ffffff" />
    </group>
  );
};

// ------------------------------------------------------------------ entrance doors
export const Entrance: React.FC<{open: number}> = ({open}) => {
  const {x, z, w, h} = L.door;
  const glass = matte('#bfe9ff', {rough: 0.05, transparent: true, opacity: 0.28});
  const frame = plastic('#adb5bd', {rough: 0.3});
  const pw = w / 2;
  return (
    <group position={[x, 0, z]}>
      {[1, -1].map((s) => (
        <group key={s} position={[s * (pw / 2 + open * pw * 0.95), 0, 0.05]}>
          <mesh geometry={G.box} material={glass} position={[0, h / 2, 0]} scale={[pw - 0.06, h - 0.06, 0.03]} />
          <Box m={frame} p={[0, h / 2, 0]} s={[0.05, h, 0.05]} />
          <Box m={frame} p={[s * (pw / 2), h / 2, 0]} s={[0.05, h, 0.05]} />
          <Box m={frame} p={[0, h - 0.02, 0]} s={[pw, 0.05, 0.05]} />
          <Box m={frame} p={[0, 0.03, 0]} s={[pw, 0.05, 0.05]} />
        </group>
      ))}
      <Box m={plastic('#495057')} p={[0, h + 0.15, 0]} s={[w + 0.3, 0.3, 0.3]} />
      <Box m={glow(open > 0.05 ? '#5dff9a' : '#ff5d5d', 1.2)} p={[0, h + 0.15, -0.16]} s={[0.25, 0.08, 0.01]} shadow={false} />
      <Sign text="WELCOME!" p={[0, h + 0.75, -0.17]} r={[0, Math.PI, 0]} w={2.0} h={0.55} bg="#ffd166" fg="#e63946" />
    </group>
  );
};

// ------------------------------------------------------------------ outside world seen through the doors
const Outside: React.FC = () => (
  <group>
    <mesh position={[-3, 6, 24]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[60, 24]} />
      <meshBasicMaterial map={skyTexture()} toneMapped={false} />
    </mesh>
    <Box m={matte('#c9d1d3')} p={[-3, -0.01, 12]} s={[20, 0.02, 6]} shadow={false} />
    <Box m={matte('#8fd16a')} p={[-3, -0.02, 19]} s={[40, 0.02, 10]} shadow={false} />
    {[[-6.5, 16], [0.5, 17.5], [-2, 20]].map(([tx, tz], i) => (
      <group key={i} position={[tx, 0, tz]}>
        <Cyl m={plastic('#8d5a3b')} p={[0, 0.6, 0]} s={[0.15, 1.2, 0.15]} />
        <Ball m={plastic('#55a630', {rough: 0.6})} p={[0, 1.7, 0]} s={[0.9, 0.85, 0.9]} />
      </group>
    ))}
    {/* the sun */}
    <mesh position={[-1.5, 7.5, 23]}>
      <circleGeometry args={[1.1, 32]} />
      <meshBasicMaterial color="#fff2a8" toneMapped={false} />
    </mesh>
  </group>
);

// ------------------------------------------------------------------ the whole building
export const Store: React.FC = React.memo(() => {
  const wall = plastic('#fff1d6', {rough: 0.8, coat: 0});
  const band = plastic('#2ec4b6', {rough: 0.6, coat: 0});
  const {door} = L;
  const lights: V3[] = [];
  for (let x = -4.6; x <= 5; x += 2.5) for (let z = -7.5; z <= 8; z += 2.5) lights.push([x, L.ceiling - 0.03, z]);
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow>
        <planeGeometry args={[14, 26]} />
        <meshStandardMaterial map={floorTexture()} roughness={0.35} metalness={0} />
      </mesh>
      {/* ceiling + light panels */}
      <Box m={matte('#fdfcf8')} p={[0, L.ceiling + 0.05, -1]} s={[14, 0.1, 21]} shadow={false} />
      {lights.map((p, i) => (
        <Box key={i} m={glow('#ffffff', 1.4)} p={p} s={[1.4, 0.04, 0.45]} shadow={false} />
      ))}
      {/* side + back walls with a teal band */}
      {[-7, 7].map((x) => (
        <group key={x}>
          <Box m={wall} p={[x, 2.1, -1]} s={[0.2, 4.2, 21]} shadow={false} />
          <Box m={band} p={[x - Math.sign(x) * 0.11, 0.6, -1]} s={[0.02, 0.3, 21]} shadow={false} />
        </group>
      ))}
      <Box m={plastic('#d9f0ff', {rough: 0.8, coat: 0})} p={[0, 2.1, L.back - 0.1]} s={[14, 4.2, 0.2]} shadow={false} />
      {/* front wall with a door opening */}
      <Box m={wall} p={[(door.x - door.w / 2 - 7) / 2, 2.1, door.z + 0.1]} s={[door.x - door.w / 2 + 7, 4.2, 0.2]} shadow={false} />
      <Box m={wall} p={[(door.x + door.w / 2 + 7) / 2, 2.1, door.z + 0.1]} s={[7 - (door.x + door.w / 2), 4.2, 0.2]} shadow={false} />
      <Box m={wall} p={[door.x, (door.h + 0.3 + 4.2) / 2, door.z + 0.1]} s={[door.w, 4.2 - door.h - 0.3, 0.2]} shadow={false} />
      <Box m={band} p={[3.5, 0.6, door.z - 0.01]} s={[7, 0.3, 0.02]} shadow={false} />
      {/* aisle */}
      <ShelfRun x={L.shelfL} face={1} z0={L.shelfZ0} z1={L.shelfZ1} seed={5} />
      <ShelfRun x={L.shelfR} face={-1} z0={L.shelfZ0} z1={L.shelfZ1} seed={9} />
      {/* back-to-back runs on the outer sides (seen in wide shots) */}
      <ShelfRun x={L.shelfL - 0.62} face={-1} z0={L.shelfZ0 - 2.5} z1={L.shelfZ1} seed={13} />
      <ShelfRun x={L.shelfR + 0.62} face={1} z0={L.shelfZ0} z1={L.shelfZ1} seed={17} />
      <Sign text="AISLE 3" sub="SNACKS · CEREAL · MILK →" p={[L.aisleX, 3.1, L.shelfZ0 + 0.1]} w={2.0} h={0.7} bg="#118ab2" fg="#ffffff" hang={1.0} />
      <ProduceStand />
      <Dairy />
      <Desk />
      {/* posters */}
      <Sign text="SALE!" sub="EVERYTHING MUST GO" p={[6.88, 2.4, 3]} r={[0, -Math.PI / 2, 0]} w={1.6} h={0.9} bg="#ef476f" fg="#ffffff" />
      <Sign text="FRESH DEALS" p={[1.6, 2.6, door.z - 0.02]} r={[0, Math.PI, 0]} w={2.2} h={0.6} bg="#06d6a0" fg="#ffffff" />
      <Outside />
    </group>
  );
});

export const HERO_CARTON_CENTER: V3 = [L.hero[0], L.hero[1] + CARTON.h / 2, L.hero[2]];
