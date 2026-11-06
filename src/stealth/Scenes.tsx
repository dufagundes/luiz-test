import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {
  add3, beat, C, Cam, clamp, easeInOut, easeOut, FONT, FPS, H, lerp, lineEnd, mix3, orbit, pop, project, ramp, sceneRange, smooth, V3, W,
} from './lib';
import {Bomber} from './three/Bomber';
import {skin, S, TE_BREAKS} from './three/bomberGeometry';
import {CameraRig, DuskLights, EnvMap, Ocean, Sky, Studio} from './three/World';
import {Airliner, Beam, GroundRing, Plume, RadarStation, Wavefront} from './three/Props';
import {FeatureTitle, Tag} from './ui/Overlay';

const useT = () => useCurrentFrame() / FPS;

const Stage: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam, children}) => (
  <ThreeCanvas width={W} height={H} shadows gl={{antialias: true, preserveDrawingBuffer: true}}>
    <CameraRig cam={cam} />
    <EnvMap />
    {children}
  </ThreeCanvas>
);

const v3 = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];
/** world position of a point given in the bomber's local frame */
const local = (p: THREE.Vector3, pos: V3, yaw = 0, scale = 1): V3 => {
  const q = p.clone().multiplyScalar(scale).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  return [q.x + pos[0], q.y + pos[1], q.z + pos[2]];
};

const BigText: React.FC<{text: string; p: number; top: number; color?: string; size?: number; rot?: number}> = ({text, p, top, color = '#fff', size = 96, rot = 0}) => {
  if (p <= 0.001) return null;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: size, color, opacity: clamp(p), transform: `scale(${0.6 + 0.4 * p}) rotate(${rot}deg)`, WebkitTextStroke: '10px #05080d', paintOrder: 'stroke fill', textShadow: '0 8px 30px rgba(0,0,0,0.6)', letterSpacing: 2}}>
      {text}
    </div>
  );
};

// =================================================================== 1. HOOK
const SUN_HOOK = new THREE.Vector3(0.22, 0.09, -1).normalize();
export const SceneHook: React.FC = () => {
  const t = useT();
  const zb = 26 - 22 * t;
  const bomberPos: V3 = [0.4, 3.4 + 0.08 * Math.sin(t * 2.1), zb];
  const camA: V3 = [-0.6, 1.9, -2];
  const chaseOff: V3 = mix3([3.0, 4.6, 8.0], [-2.0, 6.2, 9.5], ramp(t, 1.9, 5.8));
  const camC = add3(bomberPos, chaseOff);
  const k = easeInOut((t - 0.75) / 1.15);
  const cam: Cam = {
    pos: mix3(camA, camC, k),
    target: add3(bomberPos, [0, 0.2 * (1 - k), -2 * k]),
    fov: lerp(46, 52, k),
    roll: 0.12 * Math.sin(Math.PI * clamp((t - 0.7) / 1.4)),
  };
  const yaw = Math.PI;
  const tipL = project(cam, local(skin(-1, 0.3, 1), bomberPos, yaw));
  const tipR = project(cam, local(skin(1, 0.3, 1), bomberPos, yaw));
  const dimP = ramp(t, beat('hook', 1) + 0.55, beat('hook', 1) + 0.95) * (1 - ramp(t, beat('hook', 2) - 0.25, beat('hook', 2) + 0.05));
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Sky sunDir={SUN_HOOK} />
        <Ocean time={t + 12} sunDir={SUN_HOOK} center={[cam.pos[0], cam.pos[2]]} />
        <DuskLights sunDir={SUN_HOOK} />
        <Bomber position={bomberPos} rotation={[0, yaw, 0.06 * Math.sin(t * 1.3)]} exhaustGlow={0.15} />
      </Stage>
      {dimP > 0 && tipL.visible && tipR.visible && (
        <svg width={W} height={H} style={{position: 'absolute'}}>
          {(() => {
            const y = Math.min(tipL.y, tipR.y) - 90;
            const mx = (tipL.x + tipR.x) / 2;
            const half = ((tipR.x - tipL.x) / 2) * dimP;
            return (
              <g opacity={dimP}>
                <line x1={tipL.x} y1={tipL.y} x2={tipL.x} y2={y - 20} stroke={C.accent} strokeWidth={3} strokeDasharray="8 8" />
                <line x1={tipR.x} y1={tipR.y} x2={tipR.x} y2={y - 20} stroke={C.accent} strokeWidth={3} strokeDasharray="8 8" />
                <line x1={mx - half} y1={y} x2={mx + half} y2={y} stroke={C.accent} strokeWidth={6} />
                <polygon points={`${mx - half},${y} ${mx - half + 24},${y - 13} ${mx - half + 24},${y + 13}`} fill={C.accent} />
                <polygon points={`${mx + half},${y} ${mx + half - 24},${y - 13} ${mx + half - 24},${y + 13}`} fill={C.accent} />
                <text x={mx} y={y - 34} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={88} fill="#fff" stroke="#05080d" strokeWidth={10} paintOrder="stroke">
                  172 FT
                </text>
                <text x={mx} y={y + 58} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={34} fill={C.accent} stroke="#05080d" strokeWidth={7} paintOrder="stroke">
                  (52 m) WINGSPAN
                </text>
              </g>
            );
          })()}
        </svg>
      )}
    </AbsoluteFill>
  );
};

// =================================================================== 2. RADAR BASICS
const SUN_RADAR = new THREE.Vector3(-0.35, 0.1, -1).normalize();
export const SceneRadar: React.FC = () => {
  const t = useT();
  const {dur} = sceneRange('radar');
  const cam: Cam = {pos: [lerp(5.5, 4.2, smooth(t / dur)), lerp(4.4, 5.4, smooth(t / dur)), lerp(17, 14, smooth(t / dur))], target: [0, 9.5, -30], fov: 52};
  const dish: V3 = [0, 3.25, 0];
  const jet: V3 = [-3.2 + t * 1.2, 17, -36];
  const bomb: V3 = [3.5 - t * 1.4, 6.5, -30];
  const speed = 30;
  const pulses = [0.15, 2.45];
  const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const dirTo = (a: V3, b: V3): V3 => [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const dJet = dist(dish, jet);
  const dB = dist(dish, bomb);
  const mid: V3 = [(jet[0] + bomb[0]) / 2, (jet[1] + bomb[1]) / 2, (jet[2] + bomb[2]) / 2];
  const waves: React.ReactNode[] = [];
  pulses.forEach((p0, i) => {
    const r = (t - p0) * speed;
    if (r > 0 && r < 50) waves.push(<Wavefront key={'o' + i} origin={dish} dir={dirTo(dish, mid)} radius={r} spread={0.42} alpha={1 - r / 50} />);
    const rj = (t - p0 - dJet / speed) * speed;
    if (rj > 0 && rj < dJet + 4) waves.push(<Wavefront key={'j' + i} origin={jet} dir={dirTo(jet, dish)} radius={rj} spread={0.55} color={C.red} alpha={1.3 * (1 - rj / (dJet + 6))} />);
    const rb = (t - p0 - dB / speed) * speed;
    if (rb > 0 && rb < dB) waves.push(<Wavefront key={'b' + i} origin={bomb} dir={dirTo(bomb, dish)} radius={rb} spread={0.14} color={C.cyan} alpha={0.22 * (1 - rb / dB)} />);
  });
  const jetEcho = pulses[0] + dJet / speed;
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Sky sunDir={SUN_RADAR} />
        <Ocean time={t + 40} sunDir={SUN_RADAR} />
        <DuskLights sunDir={SUN_RADAR} />
        <RadarStation position={[0, 0, 0]} angle={Math.PI + 0.12 * Math.sin(t * 1.4)} glow={0.5 + 0.5 * Math.sin(t * 8)} />
        <Airliner position={jet} rotation={[0, Math.PI / 2, 0.04]} scale={1.1} />
        <Bomber position={bomb} rotation={[0, -Math.PI / 2, -0.03]} scale={0.95} />
        {waves}
      </Stage>
      <Tag at={project(cam, jet)} dx={-60} dy={-200} align="center" text="Normal jet" sub="BIG echo comes back" color={C.red} p={pop(t, jetEcho + 0.1)} />
      <Tag at={project(cam, bomb)} dx={-40} dy={170} align="center" text="Stealth bomber" sub="tiny echo" color={C.cyan} p={pop(t, beat('radar', 3))} />
      <Tag at={project(cam, [0, 3.4, 0])} dx={150} dy={-60} text="Radar" sub="sends + listens" color={C.green} p={pop(t, 0.35) * (1 - ramp(t, 2.2, 2.6))} />
    </AbsoluteFill>
  );
};

// =================================================================== 3. FLYING WING
export const SceneF1: React.FC = () => {
  const t = useT();
  const {dur} = sceneRange('f1');
  const push = ramp(t, beat('f1', 4) - 0.3, beat('f1', 4) + 1.2);
  const cam: Cam = {
    pos: orbit([0, lerp(0.9, 0.2, push), 0], lerp(13, 9.5, push), 0.7 + t * 0.12, lerp(0.42, 0.5, push)),
    target: [0, lerp(1.1, 0.1, push), 0],
    fov: 42,
  };
  const jetIn = pop(t, beat('f1', 2) - 0.25, 0.5);
  const jetOut = ramp(t, beat('f1', 4) - 0.3, beat('f1', 4) + 0.4);
  const jetP: V3 = [0, lerp(2.4, 4.5, jetOut) + (1 - clamp(jetIn)) * 1.5, -0.6];
  const jetOpacity = clamp(jetIn) * (1 - jetOut);
  const jetYaw = 0.6 + t * 0.25;
  const finWorld: V3 = add3(jetP, new THREE.Vector3(0, 1.05, -2.9).multiplyScalar(0.62).applyAxisAngle(new THREE.Vector3(0, 1, 0), jetYaw).toArray() as V3);
  const bodyWorld: V3 = add3(jetP, new THREE.Vector3(0, 0.15, 1.6).multiplyScalar(0.62).applyAxisAngle(new THREE.Vector3(0, 1, 0), jetYaw).toArray() as V3);
  const center = project(cam, local(skin(0, 0.35, 1), [0, 0, 0]));
  const edge = project(cam, local(skin(0.62, 0.0, 1), [0, 0, 0]));
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Studio />
        <Bomber position={[0, 0, 0]} rotation={[0, 0, 0]} exhaustGlow={0} />
        {jetOpacity > 0.01 && <Airliner position={jetP} rotation={[0, jetYaw, 0]} scale={0.62} highlight={ramp(t, beat('f1', 2), beat('f1', 2) + 0.3) * (0.7 + 0.3 * Math.sin(t * 10))} opacity={jetOpacity} />}
      </Stage>
      <FeatureTitle n={1} t={t} dur={dur} />
      <Tag at={project(cam, finWorld)} dx={40} dy={200} align="center" text="Tail fins" sub="✕ extra reflectors" color={C.red} p={pop(t, beat('f1', 2)) * (1 - jetOut)} />
      <Tag at={project(cam, bodyWorld)} dx={-150} dy={-60} text="Fuselage" sub="✕ bulky body" color={C.red} p={pop(t, beat('f1', 3)) * (1 - jetOut)} />
      <Tag at={center} dx={-120} dy={-230} text="Blended body" sub="one smooth shape" color={C.cyan} p={pop(t, beat('f1', 5))} />
      <Tag at={edge} dx={20} dy={250} text="Fewer corners" sub="nothing sticks out" color={C.green} p={pop(t, beat('f1', 6))} />
    </AbsoluteFill>
  );
};

// =================================================================== 4. RADAR-REFLECTING GEOMETRY
const flat = (u: number, s: number, y: number): THREE.Vector3 => {
  const v = skin(u, s, 1);
  return new THREE.Vector3(v.x, y, v.z);
};
export const SceneF2: React.FC = () => {
  const t = useT();
  const {dur} = sceneRange('f2');
  const swing = easeInOut((t - (beat('f2', 3) - 0.5)) / 1.3);
  const bPos: V3 = [0, lerp(0, 2.2, swing), 0];
  const top: Cam = {pos: [0, 21, -4.5 + t * 0.3], target: [0, 0, -0.6], fov: 45};
  const side: Cam = {pos: orbit([0, 2.2, 0], 13, 2.35 + (t - 3) * 0.06, 0.05), target: [0.6, 1.4, 0], fov: 46};
  const cam: Cam = {pos: mix3(top.pos, side.pos, swing), target: mix3(top.target, side.target, swing), fov: lerp(top.fov, side.fov, swing)};
  // planform edges, grouped by direction (every edge is parallel to one of two directions)
  const yLine = 0.5;
  const A: [THREE.Vector3, THREE.Vector3][] = [
    [flat(0, 0, yLine), flat(1, 0, yLine)],
    [flat(TE_BREAKS[1], 1, yLine), flat(TE_BREAKS[2], 1, yLine)],
    [flat(TE_BREAKS[3], 1, yLine), flat(1, 1, yLine)],
    [flat(0, 1, yLine), flat(-TE_BREAKS[1], 1, yLine)],
    [flat(-TE_BREAKS[2], 1, yLine), flat(-TE_BREAKS[3], 1, yLine)],
  ];
  const mirror = (v: THREE.Vector3) => new THREE.Vector3(-v.x, v.y, v.z);
  const B = A.map(([a, b]) => [mirror(a), mirror(b)] as [THREE.Vector3, THREE.Vector3]);
  const lineAlpha = 1 - ramp(t, beat('f2', 3) - 0.4, beat('f2', 3) + 0.2);
  // radar rays bouncing off the underside
  const src = new THREE.Vector3(-9.5, -1.0, 7.5);
  const rays = [-0.45, -0.22, 0, 0.22, 0.45].map((u, i) => {
    const hitL = skin(u, 0.42, -1);
    const e = 0.01;
    const du = skin(u + e, 0.42, -1).sub(skin(u - e, 0.42, -1));
    const ds = skin(u, 0.42 + e, -1).sub(skin(u, 0.42 - e, -1));
    const n = new THREE.Vector3().crossVectors(du, ds).normalize();
    if (n.y > 0) n.negate();
    const hit = hitL.clone().add(new THREE.Vector3(...bPos));
    const d = hit.clone().sub(src).normalize();
    const r = d.clone().sub(n.clone().multiplyScalar(2 * d.dot(n))).normalize();
    const tEnd = (hit.y - -1.15) / Math.max(0.05, -r.y);
    const out = hit.clone().add(r.multiplyScalar(Math.min(12, tEnd)));
    const t0 = beat('f2', 4) - 0.3 + i * 0.12;
    return {hit, out, inP: (t - t0) / 0.55, outP: (t - t0 - 0.55) / 0.7};
  });
  const rayEnd = rays[2].out;
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Studio />
        <Bomber position={bPos} />
        {lineAlpha > 0.01 && (
          <>
            {A.map(([a, b], i) => (
              <Beam key={'a' + i} from={a} to={b} progress={(t - 0.9 - i * 0.18) / 0.4} color={C.cyan} width={0.045} alpha={lineAlpha} />
            ))}
            {B.map(([a, b], i) => (
              <Beam key={'b' + i} from={a} to={b} progress={(t - 2.0 - i * 0.18) / 0.4} color="#ff4fd8" width={0.045} alpha={lineAlpha} />
            ))}
          </>
        )}
        {swing > 0.5 && <RadarStation position={[src.x, -1.2, src.z]} angle={Math.atan2(-src.x, -src.z)} scale={0.7} />}
        {rays.map((r, i) => (
          <React.Fragment key={i}>
            <Beam from={src.clone().add(new THREE.Vector3(0, 2.2, 0))} to={r.hit} progress={r.inP} color={C.cyan} width={0.035} />
            <Beam from={r.hit} to={r.out} progress={r.outP} color={C.accent} width={0.035} />
          </React.Fragment>
        ))}
      </Stage>
      <FeatureTitle n={2} t={t} dur={dur} />
      <Tag at={project(cam, v3(A[0][0].clone().lerp(A[0][1], 0.6)))} dx={60} dy={-260} text="Parallel edges" sub="only 2 main directions" color={C.cyan} p={pop(t, 1.3) * lineAlpha} />
      <Tag at={project(cam, [src.x, src.y + 2.2, src.z])} dx={80} dy={-170} text="Receiver" sub="hears almost nothing" color={C.green} p={pop(t, beat('f2', 5))} />
      <Tag at={project(cam, v3(rayEnd))} dx={-120} dy={-150} text="Scattered away" color={C.accent} p={pop(t, beat('f2', 5) + 0.5)} />
    </AbsoluteFill>
  );
};

// =================================================================== 5. RADAR-ABSORBENT MATERIALS
/** a sine-wave tube travelling along a straight path */
const WaveTube: React.FC<{from: THREE.Vector3; to: THREE.Vector3; amp: number | ((s: number) => number); wl: number; phase: number; progress: number; color: string; opacity?: number; radius?: number}> = ({
  from, to, amp, wl, phase, progress, color, opacity = 1, radius = 0.035,
}) => {
  const p = clamp(progress);
  const geo = useMemo(() => {
    if (p <= 0.01) return null;
    const dir = to.clone().sub(from);
    const len = dir.length() * p;
    dir.normalize();
    const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1)).normalize();
    const pts: THREE.Vector3[] = [];
    const n = Math.max(8, Math.floor(len * 40));
    for (let i = 0; i <= n; i++) {
      const s = (i / n) * len;
      const a = typeof amp === 'function' ? amp(s / dir.length()) : amp;
      pts.push(from.clone().addScaledVector(dir, s).addScaledVector(side, a * Math.sin(((s - phase) / wl) * Math.PI * 2)));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, radius, 8, false);
  }, [from, to, amp, wl, phase, p, radius]);
  useEffect(() => () => geo?.dispose(), [geo]);
  if (!geo) return null;
  return (
    <mesh geometry={geo} renderOrder={6}>
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
    </mesh>
  );
};

export const SceneF3: React.FC = () => {
  const t = useT();
  const {dur} = sceneRange('f3');
  const rise = easeOut(t / 0.9);
  const cam: Cam = {pos: [lerp(4.5, 2.6, smooth(t / dur)), lerp(3.4, 2.6, smooth(t / dur)), lerp(10.5, 8.2, smooth(t / dur))], target: [0, 1.6, 0], fov: 42};
  const slabY = lerp(-1.2, 0.6, rise);
  const P = new THREE.Vector3(0, slabY + 0.3, 0); // impact point on the coating surface
  const src = new THREE.Vector3(-4.2, slabY + 5.8, 0);
  const refl = new THREE.Vector3(4.2, slabY + 5.8, 0);
  const hitT = 1.55;
  const heat = ramp(t, hitT, hitT + 0.6) * (0.85 + 0.15 * Math.sin(t * 9));
  const inP = (t - 0.55) / (hitT - 0.55);
  const fromIn = useMemo(() => src.clone(), [slabY]);
  const P0 = useMemo(() => P.clone(), [slabY]);
  const deep = useMemo(() => P.clone().add(new THREE.Vector3(0.35, -0.55, 0)), [slabY]);
  const ref1 = useMemo(() => refl.clone(), [slabY]);
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Studio />
        <Bomber position={[0, 0.3, -9]} rotation={[0, 0.5, 0]} scale={1.1} />
        <group position={[0, slabY, 0]} rotation={[0, -0.25, 0]}>
          {/* layered cut-away of the skin */}
          <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.6, 0.3, 3.2]} />
            <meshStandardMaterial color="#20242b" roughness={0.85} metalness={0.05} emissive="#ff5a10" emissiveIntensity={0} />
          </mesh>
          <mesh position={[0, -0.12, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.6, 0.22, 3.2]} />
            <meshStandardMaterial color="#5d6977" roughness={0.45} metalness={0.6} />
          </mesh>
          <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.6, 0.5, 3.2]} />
            <meshStandardMaterial color="#8c97a6" roughness={0.6} metalness={0.4} wireframe={false} />
          </mesh>
          {/* heat glow where energy is absorbed */}
          <mesh position={[0.15, 0.16, 0.25]} scale={[1 + heat * 0.9, 0.35, 1 + heat * 0.9]}>
            <sphereGeometry args={[0.55, 32, 16]} />
            <meshBasicMaterial color="#ff7a1a" transparent opacity={0.65 * heat} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <pointLight position={[0.1, 0.8, 0.3]} intensity={18 * heat} distance={6} color="#ff7a2a" />
        </group>
        <WaveTube from={fromIn} to={P0} amp={0.22} wl={0.7} phase={t * 2.4} progress={inP} color={C.cyan} radius={0.05} />
        <WaveTube from={P0} to={deep} amp={(s) => 0.18 * Math.exp(-s * 4)} wl={0.35} phase={t * 1.2} progress={(t - hitT) / 0.4} color="#ffb070" radius={0.04} />
        <WaveTube from={P0} to={ref1} amp={0.06} wl={0.7} phase={-t * 2.4} progress={(t - hitT - 0.3) / 1.0} color={C.cyan} opacity={0.45} radius={0.025} />
      </Stage>
      <FeatureTitle n={3} t={t} dur={dur} />
      <Tag at={project(cam, [-2.2, slabY + 0.3, 1.2])} dx={-20} dy={-330} align="left" text="Absorbent coating" sub="special radar-soaking layer" color={C.accent} p={pop(t, beat('f3', 1))} />
      <Tag at={project(cam, [1.5, slabY - 0.5, 1.3])} dx={-40} dy={210} align="center" text="Airframe" sub="structure underneath" color="#9fb3c8" p={pop(t, beat('f3', 2))} />
      <Tag at={project(cam, [0.3, slabY + 0.3, 0])} dx={60} dy={170} text="Energy → heat" color={C.orange} p={pop(t, beat('f3', 4))} />
      <Tag at={project(cam, v3(refl.clone().lerp(P, 0.35)))} dx={-30} dy={-180} align="right" text="Weaker echo" color={C.cyan} p={pop(t, beat('f3', 5))} />
    </AbsoluteFill>
  );
};

// =================================================================== 6. REDUCED HEAT SIGNATURE
export const SceneF4: React.FC = () => {
  const t = useT();
  const {dur} = sceneRange('f4');
  const under = easeInOut((t - (beat('f4', 6) - 0.7)) / 1.2);
  const bPos: V3 = [0, 1.4, 0];
  const camTop: Cam = {pos: orbit([0, 1.4, -0.6], 8.6, Math.PI + 0.55 - t * 0.08, 0.62), target: [0, 1.2, -0.4], fov: 44};
  const camLow: Cam = {pos: orbit([0, 1.4, 0], 8.0, 0.4 + (t - 5) * 0.05, -0.42), target: [0, 1.6, 0], fov: 46};
  const cam: Cam = {pos: mix3(camTop.pos, camLow.pos, under), target: mix3(camTop.target, camLow.target, under), fov: lerp(camTop.fov, camLow.fov, under)};
  const xr = ramp(t, beat('f4', 1) - 0.2, beat('f4', 1) + 0.3) * (1 - under);
  const thermal = ramp(t, beat('f4', 3) - 0.2, beat('f4', 3) + 0.4);
  const hot = ramp(t, beat('f4', 3) - 0.1, beat('f4', 3) + 0.5);
  const coolAir = ramp(t, beat('f4', 4) - 0.1, beat('f4', 4) + 0.5) * (1 - under * 0.7);
  const exhaustEm = [0.08, 0.12, 0.16, 0.2, -0.08, -0.12, -0.16, -0.2].map((u) => new THREE.Vector3(...local(skin(u, 0.93, 1), bPos)).add(new THREE.Vector3(0, 0.02, 0)));
  const intakeEm = [0.11, 0.135, 0.16, -0.11, -0.135, -0.16].map((u) => new THREE.Vector3(...local(skin(u, 0.24, 1), bPos)).add(new THREE.Vector3(0, 0.05, 0)));
  const engine = project(cam, local(new THREE.Vector3(0.155 * S, skin(0.155, 0.5, 1).y * 0.4, skin(0.155, 0.5, 1).z), bPos));
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Studio thermal={thermal} gridColor={thermal > 0.5 ? '#7a5cff' : '#38e1ff'} />
        <Bomber position={bPos} xray={xr} thermal={thermal} exhaustGlow={hot} />
        <Plume emitters={exhaustEm} dir={new THREE.Vector3(0, 0.12, -1)} time={t} intensity={hot * 1.2} length={2.8} />
        <Plume emitters={intakeEm} dir={new THREE.Vector3(0, -0.02, -1)} time={t * 0.8 + 0.3} intensity={coolAir * 0.9} hot={false} count={500} length={2.6} spread={0.1} />
      </Stage>
      {thermal > 0 && (
        <AbsoluteFill style={{pointerEvents: 'none', opacity: thermal}}>
          <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(60,0,90,0) 40%, rgba(40,0,70,0.5) 100%)', mixBlendMode: 'multiply'}} />
          <div style={{position: 'absolute', left: 60, top: 1240, fontFamily: FONT, fontWeight: 800, fontSize: 26, color: '#ffb36b', letterSpacing: 3}}>● IR VIEW</div>
          <div style={{position: 'absolute', right: 60, top: 1240, fontFamily: FONT, fontWeight: 800, fontSize: 26, color: '#8fb4ff', letterSpacing: 3}}>COOL ▬▬ HOT</div>
        </AbsoluteFill>
      )}
      <FeatureTitle n={4} t={t} dur={dur} />
      <Tag at={engine} dx={60} dy={260} text="Buried engines" sub="hidden inside the wing" color={C.cyan} p={pop(t, beat('f4', 1) + 0.2) * (1 - ramp(t, beat('f4', 3) - 0.3, beat('f4', 3)))} />
      <Tag at={project(cam, v3(exhaustEm[2].clone().add(new THREE.Vector3(0, 0.1, -1.2))))} dx={-60} dy={-260} align="center" text="Hot exhaust on top" color={C.orange} p={pop(t, beat('f4', 3)) * (1 - ramp(t, beat('f4', 4) - 0.2, beat('f4', 4)))} />
      <Tag at={project(cam, v3(intakeEm[4].clone().add(new THREE.Vector3(0, 0.05, -0.8))))} dx={-40} dy={230} align="right" text="Cool air mixes in" color="#8fd8ff" p={pop(t, beat('f4', 4)) * (1 - under)} />
      <Tag at={project(cam, local(skin(0, 0.5, -1), bPos))} dx={0} dy={300} align="center" text="Cooler underside" sub="harder for sensors below" color="#8fb4ff" p={pop(t, beat('f4', 6) + 0.3)} />
    </AbsoluteFill>
  );
};

// =================================================================== 7. INTERNAL PAYLOAD
export const SceneF5: React.FC = () => {
  const t = useT();
  const {dur} = sceneRange('f5');
  const bPos: V3 = [0, 2.6, 0];
  const cam: Cam = {pos: orbit([0, 2.4, 0.2], lerp(11.5, 10, smooth(t / dur)), 0.45 - t * 0.06, -0.36), target: [0, 2.0, 0.2], fov: 46};
  const open = ramp(t, beat('f5', 1) - 0.2, beat('f5', 1) + 0.5) * (1 - ramp(t, lineEnd('f5') - 0.9, lineEnd('f5') - 0.3));
  const ext = ramp(t, beat('f5', 3) - 0.15, beat('f5', 3) + 0.3) * (1 - ramp(t, lineEnd('f5') - 0.6, lineEnd('f5')));
  const echoT = beat('f5', 5) - 0.2;
  const pylons = [0.36, 0.52, -0.36, -0.52].map((u) => local(skin(u, 0.45, -1), bPos));
  const waves: React.ReactNode[] = [];
  pylons.forEach((p, i) => {
    for (const k of [0, 0.7]) {
      const r = (t - echoT - k - i * 0.08) * 7;
      if (r > 0 && r < 6) waves.push(<Wavefront key={i + '-' + k} origin={[p[0], p[1] - 0.15, p[2]]} dir={[0, -1, 0.15]} radius={r} spread={0.9} color={C.red} alpha={ext * (1 - r / 6)} />);
    }
  });
  const bay = local(skin(0.072, 0.52, -1), bPos);
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Studio />
        <Bomber position={bPos} bayOpen={open} external={ext} />
        {waves}
      </Stage>
      <FeatureTitle n={5} t={t} dur={dur} />
      <Tag at={project(cam, bay)} dx={60} dy={300} align="center" text="Internal bay" sub="doors close flush" color={C.cyan} p={pop(t, beat('f5', 2))} />
      <Tag at={project(cam, pylons[0])} dx={40} dy={-260} align="center" text="Hanging bombs" sub="✕ extra echoes" color={C.red} p={pop(t, beat('f5', 3) + 0.2) * ext} />
    </AbsoluteFill>
  );
};

// =================================================================== 8. TOGETHER
const SUN_TOG = new THREE.Vector3(0.5, 0.12, -1).normalize();
export const SceneTogether: React.FC = () => {
  const t = useT();
  const {dur} = sceneRange('together');
  const cam: Cam = {pos: [lerp(-8, 6, smooth(t / dur)), lerp(62, 55, smooth(t / dur)), lerp(48, 42, smooth(t / dur))], target: [0, 0, -22], fov: 52};
  const shrink = easeInOut((t - beat('together', 4)) / 1.3);
  const R = lerp(48, 16, shrink);
  const detectT = beat('together', 6) - 0.1;
  const zb = lerp(-95, -16, clamp(t / detectT)) + Math.max(0, t - detectT) * -0;
  const bomb: V3 = [-2 + Math.sin(t * 0.4) * 1.5, 7, zb + Math.max(0, t - detectT) * 4];
  const detected = pop(t, detectT, 0.4);
  const sweepAng = t * 2.2;
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Sky sunDir={SUN_TOG} />
        <Ocean time={t + 70} sunDir={SUN_TOG} center={[0, -20]} />
        <DuskLights sunDir={SUN_TOG} />
        <RadarStation position={[0, 0, 0]} angle={sweepAng} scale={1.6} />
        <GroundRing radius={R} width={0.9} color={shrink > 0.5 ? C.accent : C.red} alpha={ramp(t, 0.1, 0.6)} fill={0.07} position={[0, 0.6, 0]} />
        <GroundRing radius={R * (1 + ((t * 0.6) % 1) * 0.06)} width={0.3} color={shrink > 0.5 ? C.accent : C.red} alpha={0.4 * ramp(t, 0.1, 0.6)} position={[0, 0.6, 0]} />
        {/* rotating sweep wedge */}
        <group position={[0, 0.7, 0]} rotation={[-Math.PI / 2, 0, sweepAng]}>
          <mesh renderOrder={4}>
            <circleGeometry args={[48, 48, 0, 0.45]} />
            <meshBasicMaterial color={C.green} transparent opacity={0.12} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <Bomber position={bomb} rotation={[0, 0, 0.05]} scale={2.4} />
        {detected > 0 && <GroundRing radius={3 + detected * 4} width={0.5} color={C.accent} alpha={1 - ramp(t, detectT + 0.4, detectT + 1.4)} position={[bomb[0], 0.6, bomb[2]]} />}
      </Stage>
      <Tag at={project(cam, [0, 0.6, -R])} dx={0} dy={-150} align="center" text={shrink > 0.5 ? 'Stealth: spotted here' : 'Normal jet: spotted here'} color={shrink > 0.5 ? C.accent : C.red} p={pop(t, 0.6) * (1 - ramp(t, beat('together', 4) - 0.2, beat('together', 4))) + pop(t, beat('together', 4) + 1.0) } />
      <BigText text="NOT INVISIBLE" p={pop(t, beat('together', 3) - 0.05, 0.3) * (1 - ramp(t, beat('together', 4) + 0.2, beat('together', 4) + 0.5))} top={620} color={C.accent} size={110} rot={-4} />
      <Tag at={project(cam, bomb)} dx={80} dy={-160} text="Detected" sub="much later & closer" color={C.accent} p={detected} />
    </AbsoluteFill>
  );
};

// =================================================================== 9. OUTRO
const SUN_OUT = new THREE.Vector3(-0.1, 0.07, -1).normalize();
export const SceneOutro: React.FC = () => {
  const t = useT();
  const {dur} = sceneRange('outro');
  const zb = -12 * t;
  const bomb: V3 = [0, 5 + 0.1 * Math.sin(t), zb];
  const off: V3 = [lerp(-4.5, 3.0, smooth(t / dur)), lerp(1.2, 3.6, smooth(t / dur)), lerp(9, 14, smooth(t / dur))];
  const cam: Cam = {pos: add3(bomb, off), target: add3(bomb, [0, 1.9, -3]), fov: 50, roll: -0.04};
  const card = pop(t, beat('outro', 1) - 0.1, 0.45) * (1 - ramp(t, beat('outro', 6) - 0.3, beat('outro', 6)));
  const range = pop(t, beat('outro', 3), 0.4);
  const cta = pop(t, beat('outro', 6) - 0.1, 0.45);
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Sky sunDir={SUN_OUT} tint={0.6} />
        <Ocean time={t + 90} sunDir={SUN_OUT} center={[cam.pos[0], cam.pos[2]]} />
        <DuskLights sunDir={SUN_OUT} />
        <Bomber position={bomb} rotation={[0, Math.PI, -0.08 + 0.04 * Math.sin(t * 0.8)]} exhaustGlow={0.2} />
      </Stage>
      {card > 0.001 && (
        <div style={{position: 'absolute', top: 560, left: 70, right: 70, padding: '34px 30px', borderRadius: 28, background: 'rgba(6,10,18,0.82)', border: `3px solid ${C.accent}`, fontFamily: FONT, textAlign: 'center', opacity: clamp(card), transform: `scale(${0.85 + 0.15 * card})`}}>
          <div style={{color: C.cyan, fontWeight: 800, fontSize: 28, letterSpacing: 4}}>RADAR MATH</div>
          <div style={{color: '#fff', fontWeight: 900, fontSize: 64, marginTop: 10}}>10,000× <span style={{fontSize: 44}}>smaller echo</span></div>
          <div style={{color: C.accent, fontWeight: 900, fontSize: 60, margin: '6px 0', opacity: clamp(range)}}>↓</div>
          <div style={{color: '#fff', fontWeight: 900, fontSize: 64, opacity: clamp(range), transform: `scale(${0.7 + 0.3 * range})`}}>~10× <span style={{fontSize: 44}}>shorter range</span></div>
          <div style={{color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: 26, marginTop: 16, opacity: clamp(range)}}>detection range ∝ ⁴√(echo size)</div>
        </div>
      )}
      {cta > 0.001 && (
        <div style={{position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', justifyContent: 'center', fontFamily: FONT, opacity: clamp(cta), transform: `scale(${0.7 + 0.3 * cta})`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '24px 40px', borderRadius: 999, background: C.accent, color: C.ink, fontWeight: 900, fontSize: 50, boxShadow: '0 12px 40px rgba(0,0,0,0.5)'}}>
            <svg width={64} height={64} viewBox="0 0 24 24">
              <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill={C.ink} />
              <circle cx={8} cy={11} r={1.4} fill={C.accent} />
              <circle cx={12} cy={11} r={1.4} fill={C.accent} />
              <circle cx={16} cy={11} r={1.4} fill={C.accent} />
            </svg>
            NEXT BREAKDOWN?
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
