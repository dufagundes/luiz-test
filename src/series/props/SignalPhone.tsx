import React from 'react';
import {interpolate, spring} from 'remotion';
import {T} from '../theme';

/**
 * The phone used for "THE LAST SIGNAL" messages. Local size 600 x 1200, centered on (x, y).
 * mode 'lock'   -> lock screen 11:47 + the Signal notification
 * mode 'thread' -> a message thread with a date header (used for Theo's 3-weeks-old message)
 */
export const SIGNAL_TEXT = ['YOU HAVE 24 HOURS.', 'DO NOT TRUST THE', 'PERSON CLOSEST', 'TO YOU.'];

export const SignalPhone: React.FC<{
  frame: number;
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  mode: 'lock' | 'thread';
  notifAt?: number;
  dateLabel?: string;
  owner?: string; // shown in the thread header
  screenOn?: number;
  glitch?: number;
  id?: string;
  lockTime?: string;
  notif?: {title: string; sub: string; lines: string[]; firstLineRed?: boolean; icon?: 'signal' | 'contact'};
  second?: {lines: string[]; at: number; label?: string}; // thread mode: a second (private) message
}> = ({
  frame,
  x,
  y,
  scale = 1,
  rotate = 0,
  mode,
  notifAt = 0,
  dateLabel = 'FRI, OCT 23 · 11:47 PM',
  owner = '',
  screenOn = 1,
  glitch = 0,
  id = 'p',
  lockTime = '11:47',
  notif = {title: 'UNKNOWN', sub: '+0 000 000 0000 · now', lines: SIGNAL_TEXT, firstLineRed: true, icon: 'signal'},
  second,
}) => {
  const s2 = second ? spring({frame: frame - second.at, fps: 30, config: {damping: 12, stiffness: 170, mass: 0.6}}) : 0;
  const W = 600;
  const H = 1200;
  const s = spring({frame: frame - notifAt, fps: 30, config: {damping: 13, stiffness: 160, mass: 0.6}});
  const gx = glitch > 0 ? Math.sin(frame * 9.1) * 16 * glitch : 0;
  const lineStyle = {fontFamily: T.font, fontWeight: 900, fontSize: 43} as const;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <defs>
        <clipPath id={`scr-${id}`}>
          <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={70} />
        </clipPath>
        <radialGradient id={`pglow-${id}`}>
          <stop offset="0" stopColor={T.phone} stopOpacity="0.5" />
          <stop offset="1" stopColor={T.phone} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={0} rx={W * 1.2} ry={H * 0.8} fill={`url(#pglow-${id})`} opacity={screenOn} style={{mixBlendMode: 'screen'}} />
      <rect x={-W / 2 - 18} y={-H / 2 - 18} width={W + 36} height={H + 36} rx={86} fill="#0b0c12" stroke="#3b4058" strokeWidth={6} />
      <g clipPath={`url(#scr-${id})`}>
        <rect x={-W / 2} y={-H / 2} width={W} height={H} fill="#05060a" />
        <g opacity={screenOn} transform={`translate(${gx} 0)`}>
          {mode === 'lock' ? (
            <>
              <rect x={-W / 2} y={-H / 2} width={W} height={H} fill="#101830" />
              <circle cx={0} cy={420} r={420} fill="#1c2a5a" opacity={0.6} />
              <text x={0} y={-330} fill="#e9eeff" fontFamily={T.font} fontWeight={300} fontSize={160} textAnchor="middle">
                {lockTime}
              </text>
              <text x={0} y={-262} fill="#b8c3e8" fontFamily={T.font} fontWeight={600} fontSize={30} textAnchor="middle">
                Friday, November 13
              </text>
              <g transform={`translate(0 ${interpolate(s, [0, 1], [-160, 20])})`} opacity={Math.min(1, s * 2)}>
                <rect x={-275} y={-110} width={550} height={400} rx={38} fill="#f2f4fb" opacity={0.97} />
                {notif.icon === 'contact' ? (
                  <g>
                    <circle cx={-210} cy={-52} r={32} fill="#4f6a3a" />
                    <text x={-210} y={-40} fill="#fff" fontFamily={T.font} fontWeight={900} fontSize={32} textAnchor="middle">
                      T
                    </text>
                  </g>
                ) : (
                  <g>
                    <rect x={-240} y={-82} width={60} height={60} rx={14} fill={T.uiRed} />
                    <path d="M -222 -40 L -222 -58 M -210 -40 L -210 -66 M -198 -40 L -198 -50" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
                  </g>
                )}
                <text x={-160} y={-58} fill="#1a1d2b" fontFamily={T.font} fontWeight={800} fontSize={30}>
                  {notif.title}
                </text>
                <text x={-160} y={-26} fill="#7a7f95" fontFamily={T.font} fontWeight={600} fontSize={22}>
                  {notif.sub}
                </text>
                {notif.lines.map((ln, i) => (
                  <text key={i} x={-245} y={52 + i * 58} fill={i === 0 && notif.firstLineRed ? T.uiRed : '#14172a'} style={lineStyle}>
                    {ln}
                  </text>
                ))}
              </g>
            </>
          ) : (
            <>
              <rect x={-W / 2} y={-H / 2} width={W} height={H} fill="#0e1220" />
              <rect x={-W / 2} y={-H / 2} width={W} height={200} fill="#171c2e" />
              <text x={0} y={-H / 2 + 110} fill="#e9eeff" fontFamily={T.font} fontWeight={800} fontSize={34} textAnchor="middle">
                UNKNOWN
              </text>
              <text x={0} y={-H / 2 + 150} fill="#8b93b5" fontFamily={T.font} fontWeight={600} fontSize={22} textAnchor="middle">
                {owner ? `${owner}'s phone` : '+0 000 000 0000'}
              </text>
              <text x={0} y={-H / 2 + 270} fill={T.uiRed} fontFamily={T.font} fontWeight={800} fontSize={30} textAnchor="middle" opacity={0.6 + 0.4 * Math.sin(frame * 0.3)}>
                {dateLabel}
              </text>
              <g transform={`translate(${-W / 2 + 36} ${-H / 2 + 310}) scale(${s})`}>
                <rect x={0} y={0} width={520} height={290} rx={36} fill="#262c44" />
                {SIGNAL_TEXT.map((ln, i) => (
                  <text key={i} x={30} y={70 + i * 60} fill="#fff" fontFamily={T.font} fontWeight={800} fontSize={44}>
                    {ln}
                  </text>
                ))}
              </g>
              {second ? (
                <g>
                  <text x={0} y={-H / 2 + 650} fill={T.uiRed} fontFamily={T.font} fontWeight={800} fontSize={26} textAnchor="middle" opacity={Math.min(1, s2 * 2)}>
                    {second.label ?? 'FRI, OCT 23 · 11:48 PM'}
                  </text>
                  <g transform={`translate(${-W / 2 + 36} ${-H / 2 + 680}) scale(${s2})`}>
                    <rect x={0} y={0} width={528} height={60 + second.lines.length * 60} rx={36} fill={T.uiRed} />
                    {second.lines.map((ln, i) => (
                      <text key={i} x={30} y={74 + i * 60} fill="#fff" fontFamily={T.font} fontWeight={900} fontSize={44}>
                        {ln}
                      </text>
                    ))}
                  </g>
                </g>
              ) : (
                <text x={-W / 2 + 40} y={-H / 2 + 640} fill="#8b93b5" fontFamily={T.font} fontWeight={600} fontSize={24}>
                  Read 11:52 PM
                </text>
              )}
            </>
          )}
        </g>
        <path d={`M ${-W / 2} ${-H / 2} L ${W / 2 - 200} ${-H / 2} L ${-W / 2} ${H / 2 - 300} Z`} fill="#fff" opacity={0.035} />
      </g>
      <rect x={-70} y={-H / 2 + 16} width={140} height={32} rx={16} fill="#0b0c12" />
    </g>
  );
};
