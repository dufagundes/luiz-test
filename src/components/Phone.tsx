import React from 'react';
import {spring} from 'remotion';
import {COLORS, FPS} from '../lib/constants';
import {clamp} from '../lib/anim';
import {interpolate} from 'remotion';

const FONT = "'Montserrat', 'Segoe UI', Arial, sans-serif";

export type Bubble = {text: string; at: number; danger?: boolean};

/**
 * Large phone drawn in SVG (local size 600 x 1200, centered at 0,0).
 * mode "lock": lock screen + notification. mode "chat": message thread with "Me".
 */
export const BigPhone: React.FC<{
  frame: number;
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  mode: 'lock' | 'chat';
  notifAt?: number;
  notifText?: string;
  notifTitle?: string;
  bubbles?: Bubble[];
  typingFrom?: number;
  typingTo?: number;
  screenOn?: number;
  glitch?: number;
}> = ({frame, x, y, scale = 1, rotate = 0, mode, notifAt = 0, notifText = '', notifTitle = 'Me (2034)', bubbles = [], typingFrom, typingTo, screenOn = 1, glitch = 0}) => {
  const W = 600;
  const H = 1200;
  const pop = (at: number) => spring({frame: frame - at, fps: FPS, config: {damping: 12, stiffness: 160, mass: 0.6}});
  const gx = glitch > 0 ? Math.sin(frame * 9.1) * 14 * glitch : 0;

  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {/* glow on surroundings */}
      <ellipse cx={0} cy={0} rx={W * 1.3} ry={H * 0.85} fill="url(#phoneGlow)" opacity={0.45 * screenOn} style={{mixBlendMode: 'screen'}} />
      {/* body */}
      <rect x={-W / 2 - 18} y={-H / 2 - 18} width={W + 36} height={H + 36} rx={86} fill="#0b0c12" stroke="#3b4058" strokeWidth={6} />
      <clipPath id="screenClip">
        <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={70} />
      </clipPath>
      <g clipPath="url(#screenClip)">
        <rect x={-W / 2} y={-H / 2} width={W} height={H} fill="#05060a" />
        <g opacity={screenOn} transform={`translate(${gx} 0)`}>
          {mode === 'lock' ? (
            <>
              <defs>
                <linearGradient id="lockBg" x1="0" y1="0" x2="0.4" y2="1">
                  <stop offset="0" stopColor="#1d2b5a" />
                  <stop offset="1" stopColor="#0a0f24" />
                </linearGradient>
              </defs>
              <rect x={-W / 2} y={-H / 2} width={W} height={H} fill="url(#lockBg)" />
              <text x={0} y={-330} fill="#e9eeff" fontFamily={FONT} fontWeight={300} fontSize={150} textAnchor="middle">
                3:17
              </text>
              <text x={0} y={-260} fill="#b8c3e8" fontFamily={FONT} fontWeight={500} fontSize={30} textAnchor="middle">
                Thursday, November 13
              </text>
              {/* notification */}
              {(() => {
                const s = pop(notifAt);
                const ty = interpolate(s, [0, 1], [-160, 0]);
                return (
                  <g transform={`translate(0 ${-90 + ty})`} opacity={interpolate(s, [0, 0.4], [0, 1], clamp)}>
                    <rect x={-270} y={-90} width={540} height={250} rx={36} fill="#f2f4fb" opacity={0.96} />
                    <circle cx={-205} cy={-28} r={34} fill={COLORS.danger} />
                    <text x={-205} y={-16} fill="#fff" fontFamily={FONT} fontWeight={800} fontSize={34} textAnchor="middle">
                      M
                    </text>
                    <text x={-155} y={-38} fill="#1a1d2b" fontFamily={FONT} fontWeight={800} fontSize={32}>
                      {notifTitle}
                    </text>
                    <text x={-155} y={-2} fill="#7a7f95" fontFamily={FONT} fontWeight={500} fontSize={24}>
                      now · sent from the future
                    </text>
                    {notifText.split('\n').map((ln, i) => (
                      <text key={i} x={-235} y={64 + i * 56} fill={COLORS.danger} fontFamily={FONT} fontWeight={900} fontSize={48}>
                        {ln}
                      </text>
                    ))}
                  </g>
                );
              })()}
            </>
          ) : (
            <>
              <rect x={-W / 2} y={-H / 2} width={W} height={H} fill="#0e1220" />
              {/* header */}
              <rect x={-W / 2} y={-H / 2} width={W} height={210} fill="#171c2e" />
              <circle cx={0} cy={-H / 2 + 92} r={46} fill={COLORS.hoodie} />
              <path d={`M -34 ${-H / 2 + 86} C -40 ${-H / 2 + 30} 40 ${-H / 2 + 30} 34 ${-H / 2 + 86} L 36 ${-H / 2 + 112} L -36 ${-H / 2 + 112} Z`} fill={COLORS.hair} />
              <circle cx={0} cy={-H / 2 + 98} r={24} fill={COLORS.skin} />
              <text x={0} y={-H / 2 + 172} fill="#e9eeff" fontFamily={FONT} fontWeight={800} fontSize={32} textAnchor="middle">
                Me
              </text>
              <text x={0} y={-H / 2 + 200} fill={COLORS.danger} fontFamily={FONT} fontWeight={600} fontSize={20} textAnchor="middle">
                last seen: 2034
              </text>
              {/* bubbles, oldest at the top (keeps them clear of the subtitles) */}
              {(() => {
                const visible = bubbles.filter((b) => frame >= b.at);
                const items: React.ReactNode[] = [];
                let yy = -H / 2 + 250;
                visible.forEach((b, i) => {
                  const s = pop(b.at);
                  const lines = b.text.split('\n');
                  const h = 50 + lines.length * 56;
                  const w = Math.min(520, 70 + Math.max(...lines.map((l) => l.length)) * 25);
                  items.push(
                    <g key={i} transform={`translate(${-W / 2 + 40} ${yy}) scale(${s})`}>
                      <rect x={0} y={0} width={w} height={h} rx={34} fill={b.danger ? COLORS.danger : '#262c44'} />
                      {lines.map((ln, k) => (
                        <text key={k} x={34} y={66 + k * 56} fill="#fff" fontFamily={FONT} fontWeight={800} fontSize={40}>
                          {ln}
                        </text>
                      ))}
                    </g>,
                  );
                  yy += h + 26;
                });
                const showTyping = typingFrom !== undefined && frame >= typingFrom && frame < (typingTo ?? 1e9);
                if (showTyping) {
                  items.push(
                    <g key="typing" transform={`translate(${-W / 2 + 40} ${yy})`}>
                      <rect x={0} y={0} width={130} height={80} rx={40} fill="#262c44" />
                      {[0, 1, 2].map((i) => (
                        <circle key={i} cx={34 + i * 31} cy={40} r={10} fill="#8b93b5" opacity={0.4 + 0.6 * Math.abs(Math.sin(frame * 0.25 - i * 0.7))} />
                      ))}
                    </g>,
                  );
                }
                return items;
              })()}
            </>
          )}
        </g>
        {/* screen sheen */}
        <path d={`M ${-W / 2} ${-H / 2} L ${W / 2 - 200} ${-H / 2} L ${-W / 2} ${H / 2 - 300} Z`} fill="#fff" opacity={0.035} />
      </g>
      {/* notch */}
      <rect x={-70} y={-H / 2 + 16} width={140} height={32} rx={16} fill="#0b0c12" />
    </g>
  );
};
