import React from 'react';
import {seeded, T} from '../theme';

/**
 * HARLOW POINT: panorama of the town at night, seen from above Maple Street.
 * Screen-space component (1080x1920) with parallax layers.
 *   - Cutter's Hill + the Meridian relay tower (top right), red beacon (turns white when the Fold charges)
 *   - Rows of houses whose windows can light up (phones) and black out in waves
 *   - The Vance house (foreground, attic dormer window, warm light)
 */
export type TownProps = {
  frame: number;
  camX?: number; // pan in px (parallax applied per layer)
  camY?: number;
  zoom?: number;
  focusX?: number; // zoom focus point (screen px)
  focusY?: number;
  phonesOnAt?: number; // frame when the phone-light wave starts (center out)
  phonesSpread?: number; // frames for the wave to cover the town
  blackoutAt?: number; // frame when the blackout wave starts (from the tower side)
  blackoutSpread?: number;
  towerWhiteAt?: number; // frame when the beacon switches red -> white
  lightning?: number; // 0..1
  atticLight?: number; // Vance attic window warm light 0..1
  stationLit?: number; // sheriff's station lights (still powered during the blackout, Ch.2+)
  restoreAt?: number; // finale: frame when power returns (wave outward from the tower)
  restoreSpread?: number;
  towerOffAt?: number; // finale: the beacon goes dark for good
  dawn?: number; // finale: 0..1 sunrise sky
};

type Win = {x: number; y: number; w: number; h: number; d: number; warm: boolean};
type House = {x: number; y: number; w: number; h: number; roof: number; wins: Win[]};

const buildRow = (seed: number, y: number, count: number, scale: number, x0: number, spacing: number): House[] => {
  const r = seeded(seed);
  const houses: House[] = [];
  for (let i = 0; i < count; i++) {
    const w = (140 + r() * 90) * scale;
    const h = (110 + r() * 80) * scale;
    const x = x0 + i * spacing * scale + r() * 30 * scale;
    const wins: Win[] = [];
    const cols = 2 + Math.floor(r() * 2);
    for (let c = 0; c < cols; c++) {
      const ww = 22 * scale;
      wins.push({
        x: x + ((c + 0.5) * w) / cols - ww / 2,
        y: y - h * 0.62,
        w: ww,
        h: 28 * scale,
        d: r(),
        warm: r() < 0.25,
      });
    }
    houses.push({x, y, w, h, roof: (50 + r() * 40) * scale, wins});
  }
  return houses;
};

const FAR = buildRow(101, 1010, 16, 0.55, -380, 230);
const MID = buildRow(202, 1200, 11, 0.8, -420, 230);
const NEAR = buildRow(303, 1420, 7, 1.1, -460, 250);

const TOWER = {x: 860, y: 760};

export const Town: React.FC<TownProps> = ({
  frame,
  camX = 0,
  camY = 0,
  zoom = 1,
  focusX = 540,
  focusY = 960,
  phonesOnAt = -999,
  phonesSpread = 20,
  blackoutAt = 99999,
  blackoutSpread = 40,
  towerWhiteAt = 99999,
  lightning = 0,
  atticLight = 1,
  stationLit = 0,
  restoreAt = 99999,
  restoreSpread = 40,
  towerOffAt = 99999,
  dawn = 0,
}) => {
  const towerOff = frame >= towerOffAt;
  const white = frame >= towerWhiteAt && !towerOff;
  const blink = towerOff ? 0 : white ? 0.75 + 0.25 * Math.sin(frame * 0.6) : (frame % 40) < 20 ? 1 : 0.15;
  const beacon = white ? T.signalWhite : T.signalRed;

  // window state: phone-blue when the wave reaches it, dark after the blackout wave passes
  const winFill = (win: Win, wx: number) => {
    const distFromCenter = Math.abs(wx - 540) / 900;
    const on = frame >= phonesOnAt + (distFromCenter + win.d * 0.3) * phonesSpread;
    const distFromTower = Math.abs(wx - TOWER.x) / 1400;
    const off = frame >= blackoutAt + (distFromTower + win.d * 0.15) * blackoutSpread;
    const restored = frame >= restoreAt + (distFromTower + win.d * 0.2) * restoreSpread;
    if (restored) return win.d > 0.3 ? {fill: '#f2b968', glow: 0.55} : {fill: '#0a0d18', glow: 0};
    if (off) return {fill: '#05060c', glow: 0};
    if (on) return {fill: T.phone, glow: 0.8 + 0.2 * Math.sin(frame * 0.3 + win.d * 9)};
    return win.warm ? {fill: '#e8a85a', glow: 0.5} : {fill: '#0a0d18', glow: 0};
  };

  const layer = (houses: House[], color: string, par: number, roofColor: string) => (
    <g transform={`translate(${-camX * par} ${-camY * par})`}>
      {houses.map((h, i) => (
        <g key={i}>
          <rect x={h.x} y={h.y - h.h} width={h.w} height={h.h + 400} fill={color} />
          <path d={`M ${h.x - 10} ${h.y - h.h} L ${h.x + h.w / 2} ${h.y - h.h - h.roof} L ${h.x + h.w + 10} ${h.y - h.h} Z`} fill={roofColor} />
          {h.wins.map((w, k) => {
            const st = winFill(w, w.x - camX * par);
            return (
              <g key={k}>
                {st.glow > 0 ? <rect x={w.x - w.w} y={w.y - w.h * 0.8} width={w.w * 3} height={w.h * 2.6} fill={st.fill} opacity={0.12 * st.glow} rx={w.w} /> : null}
                <rect x={w.x} y={w.y} width={w.w} height={w.h} fill={st.fill} opacity={st.glow > 0 ? 0.9 : 1} />
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );

  return (
    <g transform={`translate(${focusX} ${focusY}) scale(${zoom}) translate(${-focusX} ${-focusY})`}>
      <defs>
        <linearGradient id="townSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={T.sky0} />
          <stop offset="0.6" stopColor={T.sky1} />
          <stop offset="1" stopColor={T.sky2} />
        </linearGradient>
        <radialGradient id="beaconGlow">
          <stop offset="0" stopColor={beacon} stopOpacity="0.9" />
          <stop offset="1" stopColor={beacon} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={-600} y={-600} width={2400} height={3200} fill="url(#townSky)" />
      {dawn > 0 ? (
        <g opacity={dawn}>
          <defs>
            <linearGradient id="dawnSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2e3a6e" />
              <stop offset="0.45" stopColor="#8a5a86" />
              <stop offset="0.7" stopColor="#f08a6a" />
              <stop offset="0.85" stopColor="#ffcf8a" />
            </linearGradient>
            <radialGradient id="sunGlow">
              <stop offset="0" stopColor="#fff2c4" stopOpacity="1" />
              <stop offset="0.3" stopColor="#ffd27a" stopOpacity="0.7" />
              <stop offset="1" stopColor="#ffb05a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x={-600} y={-600} width={2400} height={1700} fill="url(#dawnSky)" />
          <circle cx={260} cy={960} r={420} fill="url(#sunGlow)" />
          <circle cx={260} cy={960} r={70} fill="#fff1c9" />
        </g>
      ) : null}
      {/* storm clouds */}
      <g transform={`translate(${-camX * 0.1 + (frame * 0.4) % 200 - 100} 0)`} opacity={0.9}>
        {[[-100, 300, 340], [300, 220, 300], [700, 330, 380], [1100, 260, 320]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.35} fill="#1a2140" />
        ))}
      </g>
      {/* Cutter's Hill + relay tower */}
      <g transform={`translate(${-camX * 0.2} ${-camY * 0.2})`}>
        <path d={`M -400 1000 Q 300 820 700 ${TOWER.y + 40} Q 900 ${TOWER.y - 10} 1100 ${TOWER.y + 60} Q 1400 860 1700 1000 L 1700 1400 L -400 1400 Z`} fill={T.hill} />
        <g transform={`translate(${TOWER.x} ${TOWER.y})`}>
          <path d="M -50 40 L 0 -420 L 50 40 Z" fill="none" stroke="#2a3150" strokeWidth={8} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const y = 40 - i * 75;
            const hw = 50 - (i * 75 * 50) / 460;
            const y2 = y - 75;
            const hw2 = 50 - ((i + 1) * 75 * 50) / 460;
            return (
              <g key={i} stroke="#2a3150" strokeWidth={4}>
                <line x1={-hw} y1={y} x2={hw2} y2={y2} />
                <line x1={hw} y1={y} x2={-hw2} y2={y2} />
                <line x1={-hw} y1={y} x2={hw} y2={y} />
              </g>
            );
          })}
          <rect x={-40} y={-300} width={30} height={16} fill="#2a3150" />
          <rect x={10} y={-240} width={34} height={16} fill="#2a3150" />
          <circle cx={0} cy={-430} r={white ? 160 : 90} fill="url(#beaconGlow)" opacity={blink} />
          <circle cx={0} cy={-430} r={10} fill={towerOff ? '#2a3150' : beacon} opacity={towerOff ? 1 : 0.4 + 0.6 * blink} />
          {white ? (
            // pulse rings: the signal
            [0, 1, 2].map((i) => {
              const t = ((frame - towerWhiteAt) * 0.03 + i / 3) % 1;
              return <circle key={i} cx={0} cy={-430} r={20 + t * 420} fill="none" stroke={T.signalWhite} strokeWidth={4 * (1 - t)} opacity={0.6 * (1 - t)} />;
            })
          ) : null}
        </g>
      </g>
      {layer(FAR, T.houseFar, 0.35, '#0d1120')}
      {layer(MID, T.houseMid, 0.6, '#10142a')}
      {/* Harlow Point Sheriff's Station (mid distance, left) */}
      <g transform={`translate(${-camX * 0.6} ${-camY * 0.6})`}>
        <rect x={150} y={1060} width={300} height={170} fill="#1a2038" />
        <rect x={140} y={1050} width={320} height={16} fill="#121731" />
        <rect x={240} y={1020} width={120} height={34} fill="#121731" />
        <text x={300} y={1046} fill={stationLit > 0 ? '#ffe9b8' : '#2a3150'} fontFamily={T.font} fontWeight={800} fontSize={20} textAnchor="middle" letterSpacing={2}>
          SHERIFF
        </text>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={170 + i * 56} y={1100} width={36} height={42} fill={stationLit > 0 ? '#ffe2a0' : '#0a0d18'} opacity={stationLit > 0 ? 0.6 + 0.4 * stationLit : 1} />
        ))}
        <rect x={280} y={1170} width={40} height={60} fill={stationLit > 0 ? '#ffd27a' : '#0a0d18'} />
        {stationLit > 0 ? (
          <g>
            <circle cx={300} cy={1130} r={260} fill="url(#gWarm)" opacity={0.35 * stationLit} style={{mixBlendMode: 'screen'}} />
            {/* light bar of the patrol car out front */}
            <rect x={380} y={1210} width={70} height={22} rx={6} fill="#0c0f1c" />
            <circle cx={395} cy={1206} r={7} fill={frame % 16 < 8 ? T.signalRed : '#3a0a10'} />
            <circle cx={435} cy={1206} r={7} fill={frame % 16 >= 8 ? '#3a8bff' : '#0a1a3a'} />
            <circle cx={415} cy={1206} r={60} fill={frame % 16 < 8 ? 'url(#gRed)' : 'url(#gPhone)'} opacity={0.5} />
          </g>
        ) : null}
      </g>
      {layer(NEAR, T.houseNear, 0.85, '#121731')}
      {/* the Vance house, foreground */}
      <g transform={`translate(${-camX} ${-camY})`}>
        <rect x={560} y={1500} width={520} height={600} fill="#232a48" />
        <path d="M 520 1510 L 820 1260 L 1120 1510 Z" fill="#141a30" />
        <rect x={770} y={1340} width={100} height={120} fill="#141a30" />
        <path d="M 750 1350 L 820 1290 L 890 1350 Z" fill="#0e1326" />
        <rect x={785} y={1360} width={70} height={90} fill={T.warm} opacity={0.25 + 0.75 * atticLight} />
        <rect x={785} y={1360} width={70} height={90} fill="none" stroke="#0e1326" strokeWidth={6} />
        <circle cx={820} cy={1405} r={120} fill={T.warm} opacity={0.12 * atticLight} />
        {/* bare tree */}
        <path d="M 180 2000 L 200 1500 M 196 1650 L 120 1520 M 200 1580 L 290 1460 M 160 1580 L 80 1500" stroke="#070912" strokeWidth={22} strokeLinecap="round" />
      </g>
      {/* lightning flash */}
      {lightning > 0 ? <rect x={-600} y={-600} width={2400} height={3200} fill="#dfe8ff" opacity={lightning * 0.6} /> : null}
    </g>
  );
};
