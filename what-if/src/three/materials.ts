import * as THREE from 'three';

// ---------------------------------------------------------------------------------------------
// One shared "toy plastic" look: soft, glossy, slightly clear-coated. Cheap enough for a GTX 1660 Ti.
// Materials and canvas textures are cached at module level so every frame reuses them.
// ---------------------------------------------------------------------------------------------
const cache = new Map<string, THREE.Material>();

export function plastic(color: string, opts: {rough?: number; coat?: number; emissive?: string; ei?: number; map?: THREE.Texture} = {}) {
  const key = `p:${color}:${opts.rough ?? ''}:${opts.coat ?? ''}:${opts.emissive ?? ''}:${opts.ei ?? ''}:${opts.map?.uuid ?? ''}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({
      color,
      roughness: opts.rough ?? 0.42,
      metalness: 0,
      clearcoat: opts.coat ?? 0.55,
      clearcoatRoughness: 0.3,
      emissive: opts.emissive ?? '#000000',
      emissiveIntensity: opts.ei ?? 1,
      map: opts.map ?? null,
    });
    cache.set(key, m);
  }
  return m as THREE.MeshPhysicalMaterial;
}

/** cheaper matte material for big set pieces */
export function matte(color: string, opts: {rough?: number; map?: THREE.Texture; emissive?: string; ei?: number; side?: THREE.Side; transparent?: boolean; opacity?: number} = {}) {
  const key = `m:${color}:${opts.rough ?? ''}:${opts.map?.uuid ?? ''}:${opts.emissive ?? ''}:${opts.ei ?? ''}:${opts.side ?? ''}:${opts.opacity ?? ''}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.7,
      metalness: 0,
      map: opts.map ?? null,
      emissive: opts.emissive ?? '#000000',
      emissiveIntensity: opts.ei ?? 1,
      side: opts.side ?? THREE.FrontSide,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
    });
    cache.set(key, m);
  }
  return m as THREE.MeshStandardMaterial;
}

export function glow(color: string, intensity = 1) {
  const key = `g:${color}:${intensity}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false});
    cache.set(key, m);
  }
  return m;
}

// --------------------------------------------------------------------------------- textures
const tex = new Map<string, THREE.Texture>();
function canvasTex(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, srgb = true) {
  let t = tex.get(key);
  if (t) return t;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d')!;
  draw(c);
  t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  tex.set(key, t);
  return t;
}

/** deterministic pseudo-random */
export const rand = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export const FONT = '"Baloo 2", "Arial Rounded MT Bold", Arial, sans-serif';

/** white hide with soft black blobs; wraps cleanly horizontally */
export const spotsTexture = () =>
  canvasTex('spots', 512, 256, (c) => {
    c.fillStyle = '#fbfaf6';
    c.fillRect(0, 0, 512, 256);
    c.fillStyle = '#26221f';
    const blobs: [number, number, number][] = [
      [70, 95, 46], [205, 160, 38], [330, 80, 52], [445, 175, 34], [140, 210, 22], [395, 40, 20], [260, 60, 18],
    ];
    for (const [x, y, r] of blobs) {
      for (const dx of [-512, 0, 512]) {
        c.beginPath();
        // lumpy blob = several overlapping circles
        const rr = rand(x * 7 + y);
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          c.moveTo(x + dx, y);
          c.arc(x + dx + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.35, r * (0.55 + rr() * 0.25), 0, Math.PI * 2);
        }
        c.fill();
      }
    }
  });

export const floorTexture = () => {
  const t = canvasTex('floor', 256, 256, (c) => {
    c.fillStyle = '#f4f1ea';
    c.fillRect(0, 0, 256, 256);
    c.fillStyle = '#9ed8d2';
    c.fillRect(0, 0, 128, 128);
    c.fillRect(128, 128, 128, 128);
    c.strokeStyle = 'rgba(0,0,0,0.08)';
    c.lineWidth = 3;
    c.strokeRect(0, 0, 128, 128);
    c.strokeRect(128, 128, 128, 128);
    c.strokeRect(128, 0, 128, 128);
    c.strokeRect(0, 128, 128, 128);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(14 / 1.2, 26 / 1.2);
  return t;
};

/** see-through wire basket panel for the cart (alpha-tested) */
export const gridTexture = () => {
  const t = canvasTex('grid', 128, 128, (c) => {
    c.clearRect(0, 0, 128, 128);
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 128; i += 32) {
      c.fillRect(i, 0, 9, 128);
      c.fillRect(0, i, 128, 9);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

export const skyTexture = () =>
  canvasTex('sky', 16, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#59b8ff');
    g.addColorStop(0.65, '#bfe6ff');
    g.addColorStop(1, '#fff3d6');
    c.fillStyle = g;
    c.fillRect(0, 0, 16, 256);
  });

/** big rounded sign with text */
export const signTexture = (text: string, bg: string, fg: string, w = 1024, h = 256, size = 170, sub?: string) =>
  canvasTex(`sign:${text}:${bg}:${fg}:${w}:${h}:${sub ?? ''}`, w, h, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.fillStyle = fg;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `800 ${size}px ${FONT}`;
    c.fillText(text, w / 2, sub ? h * 0.42 : h * 0.54);
    if (sub) {
      c.font = `700 ${size * 0.38}px ${FONT}`;
      c.fillText(sub, w / 2, h * 0.82);
    }
  });

/** draws the little cow face used on the milk label (looks like our hero: that's the joke) */
function drawCowFace(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = '#f2c9d2';
  c.beginPath();
  c.ellipse(-62, -18, 26, 13, -0.4, 0, Math.PI * 2);
  c.ellipse(62, -18, 26, 13, 0.4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#fffdf8';
  c.strokeStyle = '#2a2a2a';
  c.lineWidth = 5;
  c.beginPath();
  c.ellipse(0, 0, 50, 46, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = '#2a2a2a';
  c.beginPath();
  c.ellipse(24, -18, 20, 16, 0.3, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffb3c4';
  c.beginPath();
  c.ellipse(0, 24, 38, 24, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = '#2a2a2a';
  for (const ex of [-18, 18]) {
    c.beginPath();
    c.arc(ex, -8, 7, 0, Math.PI * 2);
    c.fill();
  }
  c.beginPath();
  c.ellipse(-12, 22, 5, 7, 0, 0, Math.PI * 2);
  c.ellipse(12, 22, 5, 7, 0, 0, Math.PI * 2);
  c.fill();
  // happy smile on the box (she is NOT smiling in real life)
  c.lineWidth = 4;
  c.beginPath();
  c.arc(0, 30, 14, 0.2, Math.PI - 0.2);
  c.stroke();
  c.restore();
}

export const milkLabelTexture = () =>
  canvasTex('milklabel', 512, 768, (c) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 512, 768);
    c.fillStyle = '#2f7de1';
    c.fillRect(0, 0, 512, 150);
    c.fillRect(0, 700, 512, 68);
    // wavy milk splash
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(0, 150);
    for (let x = 0; x <= 512; x += 16) c.lineTo(x, 135 + Math.sin(x / 40) * 14);
    c.lineTo(512, 160);
    c.lineTo(0, 160);
    c.fill();
    c.fillStyle = '#ffffff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `800 70px ${FONT}`;
    c.fillText('FARM FRESH', 256, 72);
    c.fillStyle = '#1d4fa0';
    c.font = `800 190px ${FONT}`;
    c.fillText('MILK', 256, 268);
    drawCowFace(c, 256, 470, 1.55);
    c.fillStyle = '#ffffff';
    c.font = `800 42px ${FONT}`;
    c.fillText('100% COW', 256, 736);
    // price sticker starburst
    c.save();
    c.translate(395, 600);
    c.rotate(-0.18);
    c.fillStyle = '#ffd21f';
    c.beginPath();
    for (let i = 0; i < 28; i++) {
      const r = i % 2 ? 78 : 98;
      const a = (i / 28) * Math.PI * 2;
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.fill();
    c.fillStyle = '#d62828';
    c.font = `800 62px ${FONT}`;
    c.fillText('$6.00', 0, 6);
    c.restore();
  });

export const cartonSideTexture = () =>
  canvasTex('milkside', 256, 512, (c) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 256, 512);
    c.fillStyle = '#2f7de1';
    c.fillRect(0, 0, 256, 100);
    c.fillRect(0, 466, 256, 46);
    c.fillStyle = '#1d4fa0';
    c.textAlign = 'center';
    c.font = `800 60px ${FONT}`;
    c.fillText('MILK', 128, 290);
  });

export const protestTexture = () =>
  canvasTex('protest', 512, 384, (c) => {
    c.fillStyle = '#fff8e7';
    c.fillRect(0, 0, 512, 384);
    c.strokeStyle = '#d62828';
    c.lineWidth = 14;
    c.strokeRect(12, 12, 488, 360);
    c.fillStyle = '#d62828';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `800 118px ${FONT}`;
    c.fillText('PAY THE', 256, 130);
    c.fillText('COW!', 256, 262);
  });

export const productTexture = (seed: number) =>
  canvasTex(`prod:${seed}`, 128, 128, (c) => {
    const r = rand(seed);
    const pal = ['#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#f78c3b', '#8e7dff', '#7bd389'];
    c.fillStyle = pal[seed % pal.length];
    c.fillRect(0, 0, 128, 128);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath();
    c.ellipse(64, 62, 40 + r() * 10, 26, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = pal[(seed + 3) % pal.length];
    c.fillRect(20, 100, 88, 12);
  });
