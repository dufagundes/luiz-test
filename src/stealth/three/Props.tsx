import React, {useMemo} from 'react';
import * as THREE from 'three';

// ------------------------------------------------------------------ conventional jet (for comparison)
export const Airliner: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  highlight?: number; // 0..1 red highlight on tail fins + fuselage
  opacity?: number;
}> = ({position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, highlight = 0, opacity = 1}) => {
  const m = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({color: '#d9dde3', roughness: 0.35, metalness: 0.4}),
      hot: new THREE.MeshStandardMaterial({color: '#d9dde3', roughness: 0.35, metalness: 0.4, emissive: new THREE.Color('#ff2a3c')}),
      dark: new THREE.MeshStandardMaterial({color: '#2a2f38', roughness: 0.4, metalness: 0.6}),
      win: new THREE.MeshStandardMaterial({color: '#0e1622', roughness: 0.1, metalness: 0.9}),
    }),
    [],
  );
  for (const k of Object.values(m)) {
    k.transparent = opacity < 1;
    k.opacity = opacity;
  }
  m.hot.emissiveIntensity = highlight * 1.4;
  m.hot.color.set('#d9dde3').lerp(new THREE.Color('#ff5a66'), highlight * 0.6);
  const wing = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.55);
    s.lineTo(3.4, -0.75);
    s.lineTo(3.4, -1.05);
    s.lineTo(0, -0.55);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth: 0.06, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2});
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const fin = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(-0.9, 1.5);
    s.lineTo(-1.35, 1.5);
    s.lineTo(-1.1, 0);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2});
    g.translate(0, 0, -0.025);
    g.rotateY(Math.PI / 2);
    return g;
  }, []);
  const stab = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.3);
    s.lineTo(1.3, -0.3);
    s.lineTo(1.3, -0.55);
    s.lineTo(0, -0.3);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth: 0.04, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2});
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* fuselage: capsule along Z */}
      <mesh material={m.hot} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.42, 6.2, 12, 28]} />
      </mesh>
      <mesh material={m.win} position={[0, 0.16, 3.25]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.46, 0.12, 0.3]} />
      </mesh>
      {[1, -1].map((sd) => (
        <group key={sd} scale={[sd, 1, 1]}>
          <mesh geometry={wing} material={m.body} position={[0.2, -0.12, 0.6]} castShadow />
          <mesh geometry={stab} material={m.hot} position={[0.1, 0.05, -2.9]} castShadow />
          <group position={[1.35, -0.42, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={m.dark} castShadow>
              <cylinderGeometry args={[0.22, 0.2, 1.1, 20]} />
            </mesh>
          </group>
        </group>
      ))}
      <mesh geometry={fin} material={m.hot} position={[0, 0.25, -2.35]} castShadow />
    </group>
  );
};

// ------------------------------------------------------------------ radar station (coastal / ship mast)
export const RadarStation: React.FC<{position?: [number, number, number]; angle: number; scale?: number; glow?: number}> = ({
  position = [0, 0, 0],
  angle,
  scale = 1,
  glow = 1,
}) => {
  const m = useMemo(
    () => ({
      steel: new THREE.MeshStandardMaterial({color: '#c9ced6', roughness: 0.4, metalness: 0.7}),
      dark: new THREE.MeshStandardMaterial({color: '#3a414c', roughness: 0.6, metalness: 0.4}),
      rock: new THREE.MeshStandardMaterial({color: '#2b2f33', roughness: 0.95, flatShading: true}),
      lamp: new THREE.MeshBasicMaterial({color: '#38e1ff', toneMapped: false}),
    }),
    [],
  );
  const dish = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const r = (i / 16) * 1.1;
      pts.push(new THREE.Vector2(r, r * r * 0.32));
    }
    const g = new THREE.LatheGeometry(pts, 40);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const rock = useMemo(() => {
    const g = new THREE.DodecahedronGeometry(2.2, 1);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const k = 1 + 0.18 * Math.sin(p.getX(i) * 3.1 + p.getZ(i) * 2.3) * Math.cos(p.getY(i) * 2.7);
      p.setXYZ(i, p.getX(i) * k * 1.3, p.getY(i) * 0.55 * k, p.getZ(i) * k * 1.3);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  m.lamp.color.set('#38e1ff').multiplyScalar(0.4 + glow);
  return (
    <group position={position} scale={scale}>
      <mesh geometry={rock} material={m.rock} position={[0, -0.2, 0]} castShadow receiveShadow />
      <mesh material={m.dark} position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[1.4, 0.9, 1.4]} />
      </mesh>
      <mesh material={m.steel} position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.24, 2.0, 16]} />
      </mesh>
      <group position={[0, 3.25, 0]} rotation={[0, angle, 0]}>
        <group rotation={[-0.25, 0, 0]}>
          <mesh geometry={dish} castShadow>
            <meshStandardMaterial color="#d6dbe2" roughness={0.3} metalness={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh material={m.dark} position={[0, 0, 0.55]}>
            <cylinderGeometry args={[0.03, 0.03, 1.1, 8]} />
          </mesh>
          <mesh material={m.lamp} position={[0, 0, 0.9]}>
            <sphereGeometry args={[0.08, 12, 12]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ radar wavefront (expanding spherical cap)
const waveVert = /* glsl */ `
varying vec3 vN; varying vec3 vW; varying vec2 vUv;
void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w; }`;
const waveFrag = /* glsl */ `
uniform vec3 col; uniform float alpha; varying vec3 vN; varying vec3 vW; varying vec2 vUv;
void main(){
  vec3 V = normalize(cameraPosition - vW);
  float rim = pow(1.0 - abs(dot(normalize(vN), normalize((viewMatrix * vec4(V,0.0)).xyz))), 1.5);
  float edge = smoothstep(0.0, 0.6, vUv.y);
  float bands = 1.0;
  gl_FragColor = vec4(col * (0.6 + 1.4 * rim), min(1.0, alpha * (0.45 + 0.9 * rim) * edge * bands));
}`;

/**
 * An expanding radar wavefront: part of a sphere, centred at `origin`, opening around `dir`.
 * radius in world units; spread = half-angle of the cap (radians).
 */
export const Wavefront: React.FC<{
  origin: [number, number, number];
  dir: [number, number, number];
  radius: number;
  spread?: number;
  color?: string;
  alpha?: number;
}> = ({origin, dir, radius, spread = 0.5, color = '#38e1ff', alpha = 1}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: waveVert,
        fragmentShader: waveFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {col: {value: new THREE.Color(color)}, alpha: {value: 1}},
      }),
    [],
  );
  const geo = useMemo(() => new THREE.SphereGeometry(1, 64, 16, 0, Math.PI * 2, 0, spread), [spread]);
  (mat.uniforms.col.value as THREE.Color).set(color);
  mat.uniforms.alpha.value = alpha;
  const q = useMemo(() => new THREE.Quaternion(), []);
  q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize());
  if (radius <= 0.01 || alpha <= 0.001) return null;
  return <mesh geometry={geo} material={mat} position={origin} quaternion={q} scale={radius} renderOrder={5} />;
};

// ------------------------------------------------------------------ glowing beam between two points (with a travelling pulse)
export const Beam: React.FC<{
  from: THREE.Vector3;
  to: THREE.Vector3;
  progress: number; // 0..1 how much of the beam is drawn
  color?: string;
  width?: number;
  alpha?: number;
}> = ({from, to, progress, color = '#38e1ff', width = 0.035, alpha = 1}) => {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= 0.001 || alpha <= 0.001) return null;
  const end = from.clone().lerp(to, p);
  const mid = from.clone().add(end).multiplyScalar(0.5);
  const len = from.distanceTo(end);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(from).normalize());
  return (
    <group>
      <mesh position={mid} quaternion={q} renderOrder={6}>
        <cylinderGeometry args={[width, width, len, 8, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={alpha} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={mid} quaternion={q} renderOrder={6}>
        <cylinderGeometry args={[width * 3.2, width * 3.2, len, 8, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={alpha * 0.18} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={end} renderOrder={7}>
        <sphereGeometry args={[width * 2.6, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={alpha} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ------------------------------------------------------------------ flat glowing ring on the ground / sea
export const GroundRing: React.FC<{
  position?: [number, number, number];
  radius: number;
  width?: number;
  color?: string;
  alpha?: number;
  fill?: number;
}> = ({position = [0, 0.05, 0], radius, width = 0.4, color = '#38e1ff', alpha = 1, fill = 0}) => {
  if (alpha <= 0.001 || radius <= 0.01) return null;
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh renderOrder={4}>
        <ringGeometry args={[radius - width / 2, radius + width / 2, 128]} />
        <meshBasicMaterial color={color} transparent opacity={alpha} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {fill > 0 && (
        <mesh renderOrder={3}>
          <circleGeometry args={[radius, 128]} />
          <meshBasicMaterial color={color} transparent opacity={alpha * fill} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

// ------------------------------------------------------------------ particle plume (deterministic: driven by time, no simulation state)
export const Plume: React.FC<{
  emitters: THREE.Vector3[];
  dir: THREE.Vector3;
  time: number;
  intensity: number;
  hot?: boolean;
  count?: number;
  length?: number;
  spread?: number;
}> = ({emitters, dir, time, intensity, hot = true, count = 900, length = 2.4, spread = 0.18}) => {
  const {geo, seeds} = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
    const s = Array.from({length: count}, (_, i) => {
      const r = (k: number) => {
        const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
        return x - Math.floor(x);
      };
      return [r(1), r(2), r(3), r(4), r(5)];
    });
    return {geo: g, seeds: s};
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({size: 0.06, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false}),
    [],
  );
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const col = geo.attributes.color as THREE.BufferAttribute;
  const d = dir.clone().normalize();
  const side = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(side, d).normalize();
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const [a, b, e, f, g] = seeds[i];
    const life = (time * 0.9 + a) % 1; // 0..1 along the plume
    const em = emitters[Math.floor(b * emitters.length) % emitters.length];
    const w = spread * (0.3 + life * 1.6);
    const p = em
      .clone()
      .addScaledVector(d, life * length)
      .addScaledVector(side, (e - 0.5) * w * 2)
      .addScaledVector(up, (f - 0.5) * w * 0.6 + life * 0.08);
    pos.setXYZ(i, p.x, p.y, p.z);
    if (hot) c.setRGB(1, 0.85 - life * 0.6, 0.35 - life * 0.35);
    else c.setRGB(0.3, 0.75, 1);
    const k = intensity * (1 - life) * (0.5 + 0.5 * g);
    col.setXYZ(i, c.r * k, c.g * k, c.b * k);
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
  if (intensity <= 0.001) return null;
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={8} />;
};
