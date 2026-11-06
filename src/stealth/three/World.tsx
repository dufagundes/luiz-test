import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {Cam} from '../lib';

/** Drives the R3F camera from our own per-frame camera description. */
export const CameraRig: React.FC<{cam: Cam}> = ({cam}) => {
  const {camera} = useThree();
  useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.fov = cam.fov;
    c.near = 0.1;
    c.far = 3000;
    c.position.set(...cam.pos);
    c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0);
    c.lookAt(...cam.target);
    c.updateProjectionMatrix();
  });
  return null;
};

/** Procedural studio environment map so metals and glass get believable reflections (no HDRI files). */
export const EnvMap: React.FC<{intensity?: number}> = () => {
  const {gl, scene} = useThree();
  useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
};

// ------------------------------------------------------------------ sky
const skyVert = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const skyFrag = /* glsl */ `
uniform vec3 sunDir; uniform vec3 zenith; uniform vec3 horizon; uniform vec3 glow;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  float h = clamp(d.y, -0.2, 1.0);
  vec3 col = mix(horizon, zenith, pow(max(h,0.0), 0.45));
  float s = max(dot(d, normalize(sunDir)), 0.0);
  col += glow * pow(s, 8.0) * 0.6 + glow * pow(s, 64.0) * 0.8 + vec3(1.0,0.9,0.7) * pow(s, 900.0) * 6.0;
  col = mix(col, horizon * 0.55, smoothstep(0.0, -0.2, d.y));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const Sky: React.FC<{sunDir: THREE.Vector3; tint?: number}> = ({sunDir, tint = 0}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          sunDir: {value: sunDir.clone()},
          zenith: {value: new THREE.Color('#0d1c3d')},
          horizon: {value: new THREE.Color('#e0835a')},
          glow: {value: new THREE.Color('#ffb070')},
        },
      }),
    [],
  );
  mat.uniforms.sunDir.value.copy(sunDir);
  (mat.uniforms.horizon.value as THREE.Color).set('#e0835a').lerp(new THREE.Color('#f2a35c'), tint);
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[1500, 48, 24]} />
    </mesh>
  );
};

// ------------------------------------------------------------------ ocean
const oceanVert = /* glsl */ `
uniform float time;
varying vec3 vWorld; varying vec3 vNormal;
// 5 Gerstner waves: direction(xy), steepness, wavelength
const int N = 5;
vec4 W[N];
void initW(){
  W[0]=vec4(normalize(vec2(1.0,0.35)), 0.10, 14.0);
  W[1]=vec4(normalize(vec2(0.7,-0.6)), 0.09, 8.5);
  W[2]=vec4(normalize(vec2(-0.25,1.0)), 0.08, 5.0);
  W[3]=vec4(normalize(vec2(0.95,0.15)), 0.07, 2.9);
  W[4]=vec4(normalize(vec2(-0.6,-0.8)), 0.06, 1.7);
}
void main(){
  initW();
  vec3 p = (modelMatrix * vec4(position,1.0)).xyz;
  vec3 g = p; vec3 tng = vec3(1,0,0); vec3 bnm = vec3(0,0,1);
  float fade = 1.0 - smoothstep(120.0, 420.0, length(p.xz - cameraPosition.xz));
  for(int i=0;i<N;i++){
    vec2 d = W[i].xy; float st = W[i].z * fade; float L = W[i].w;
    float k = 6.28318 / L; float c = sqrt(9.8 / k); float a = st / k;
    float f = k * (dot(d, p.xz) - c * time);
    g.x += d.x * a * cos(f); g.z += d.y * a * cos(f); g.y += a * sin(f);
    tng += vec3(-d.x*d.x*st*sin(f), d.x*st*cos(f), -d.x*d.y*st*sin(f));
    bnm += vec3(-d.x*d.y*st*sin(f), d.y*st*cos(f), -d.y*d.y*st*sin(f));
  }
  vNormal = normalize(cross(bnm, tng));
  vWorld = g;
  gl_Position = projectionMatrix * viewMatrix * vec4(g,1.0);
}`;
const oceanFrag = /* glsl */ `
uniform vec3 sunDir; uniform vec3 deep; uniform vec3 shallow; uniform vec3 skyCol; uniform vec3 zenCol; uniform vec3 sunCol; uniform vec3 fogCol;
uniform float time;
varying vec3 vWorld; varying vec3 vNormal;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
void main(){
  vec3 V = normalize(cameraPosition - vWorld);
  float dist = length(cameraPosition - vWorld);
  // fine ripples (fade with distance to avoid shimmering)
  float rf = 1.0 - smoothstep(20.0, 160.0, dist);
  vec2 q = vWorld.xz * 0.9 + vec2(time*0.6, time*0.35);
  vec3 n = normalize(vNormal + rf * 0.22 * vec3(vnoise(q)-0.5, 0.0, vnoise(q+17.3)-0.5));
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
  fres = min(fres, 0.6);
  vec3 water = mix(deep, shallow, clamp(0.35 + vWorld.y * 0.35, 0.0, 1.0));
  // subsurface tint on wave faces lit by the low sun
  water += shallow * 0.35 * pow(max(dot(-V, normalize(sunDir)), 0.0), 3.0) * clamp(vWorld.y + 0.3, 0.0, 1.0);
  vec3 R = reflect(-V, n);
  R.y = abs(R.y);
  vec3 sky = mix(skyCol, zenCol, pow(clamp(R.y, 0.0, 1.0), 0.5));
  vec3 refl = sky + sunCol * pow(max(dot(R, normalize(sunDir)), 0.0), 12.0) * 0.5;
  vec3 col = mix(water, refl, fres);
  float spec = pow(max(dot(R, normalize(sunDir)), 0.0), 600.0);
  col += sunCol * spec * 6.0;
  // a little foam on the highest crests
  col += vec3(0.75) * smoothstep(0.32, 0.55, vWorld.y) * 0.18;
  float fog = smoothstep(80.0, 900.0, dist);
  col = mix(col, fogCol, fog);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const Ocean: React.FC<{time: number; sunDir: THREE.Vector3; center?: [number, number]}> = ({time, sunDir, center = [0, 0]}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: oceanVert,
        fragmentShader: oceanFrag,
        uniforms: {
          time: {value: 0},
          sunDir: {value: sunDir.clone()},
          deep: {value: new THREE.Color('#031322')},
          shallow: {value: new THREE.Color('#0d4a66')},
          skyCol: {value: new THREE.Color('#b77a66')},
          zenCol: {value: new THREE.Color('#1a2f5a')},
          sunCol: {value: new THREE.Color('#ffc58a')},
          fogCol: {value: new THREE.Color('#d98a62')},
        },
      }),
    [],
  );
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1800, 1800, 260, 260);
    g.rotateX(-Math.PI / 2);
    // concentrate vertices near the centre (where the camera is)
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / 900;
      const z = p.getZ(i) / 900;
      p.setX(i, Math.sign(x) * Math.pow(Math.abs(x), 2.2) * 900);
      p.setZ(i, Math.sign(z) * Math.pow(Math.abs(z), 2.2) * 900);
    }
    return g;
  }, []);
  mat.uniforms.time.value = time;
  mat.uniforms.sunDir.value.copy(sunDir);
  return <mesh geometry={geo} material={mat} position={[center[0], 0, center[1]]} frustumCulled={false} />;
};

/** Dusk lighting for ocean scenes. */
export const DuskLights: React.FC<{sunDir: THREE.Vector3; shadowTarget?: [number, number, number]}> = ({sunDir, shadowTarget = [0, 0, 0]}) => {
  const target = useMemo(() => new THREE.Object3D(), []);
  target.position.set(...shadowTarget);
  target.updateMatrixWorld();
  const p = sunDir.clone().multiplyScalar(60).add(new THREE.Vector3(...shadowTarget));
  return (
    <>
      <hemisphereLight args={['#ffb38a', '#0b2236', 0.9]} />
      <directionalLight position={p} intensity={3.2} color="#ffc48f" target={target} />
      <directionalLight position={[-30, 20, -40]} intensity={0.8} color="#6f8fff" />
      <primitive object={target} />
    </>
  );
};

// ------------------------------------------------------------------ studio
const gridFrag = /* glsl */ `
varying vec2 vUv; uniform vec3 col; uniform float fade;
void main(){
  vec2 p = (vUv - 0.5) * 80.0;
  vec2 g = abs(fract(p) - 0.5);
  float line = 1.0 - smoothstep(0.0, 0.035, min(g.x, g.y));
  vec2 g2 = abs(fract(p / 5.0) - 0.5);
  float major = 1.0 - smoothstep(0.0, 0.012, min(g2.x, g2.y));
  float r = length(vUv - 0.5) * 2.0;
  float a = (line * 0.35 + major * 0.55) * (1.0 - smoothstep(0.15, 0.85, r)) * fade;
  gl_FragColor = vec4(col, a);
}`;

export const Studio: React.FC<{gridColor?: string; floorY?: number; thermal?: number}> = ({gridColor = '#38e1ff', floorY = -1.2, thermal = 0}) => {
  const grid = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
        fragmentShader: gridFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {col: {value: new THREE.Color(gridColor)}, fade: {value: 1}},
      }),
    [],
  );
  (grid.uniforms.col.value as THREE.Color).set(gridColor);
  const floor = useMemo(() => new THREE.MeshStandardMaterial({color: '#0c1420', roughness: 0.55, metalness: 0.2}), []);
  floor.color.set('#0c1420').lerp(new THREE.Color('#060716'), thermal);
  const bg = new THREE.Color('#0a1626').lerp(new THREE.Color('#05040f'), thermal);
  return (
    <>
      <color attach="background" args={[bg.getStyle()]} />
      <fog attach="fog" args={[bg.getStyle(), 18, 60]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 0]} material={floor} receiveShadow>
        <planeGeometry args={[200, 200]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY + 0.005, 0]} material={grid}>
        <planeGeometry args={[80, 80]} />
      </mesh>
      <hemisphereLight args={['#9fc3ff', '#0b1220', 0.55]} />
      <directionalLight
        position={[6, 14, 8]}
        intensity={2.6}
        color="#fff3e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-8, 4, -10]} intensity={2.2} color="#4fb8ff" />
      <pointLight position={[0, 3, 6]} intensity={8} distance={20} color="#88aaff" />
    </>
  );
};
