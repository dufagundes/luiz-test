import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Character} from './rig/Character';
import {CAST} from './cast';
import {T} from './theme';

/** Model sheet: every cast member side by side (render a still to check consistency). */
export const CastSheet: React.FC = () => {
  const f = useCurrentFrame();
  const list = Object.values(CAST);
  return (
    <AbsoluteFill style={{background: '#2a2d44'}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        {list.map((c, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const x = 190 + col * 350;
          const y = 860 + row * 900;
          return (
            <g key={c.id}>
              <Character who={c} x={x} y={y} scale={0.95} frame={f} mouth="smile" />
              <text x={x} y={y + 70} fill="#fff" fontFamily={T.font} fontWeight={800} fontSize={34} textAnchor="middle">
                {c.name}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
