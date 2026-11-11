import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CLAMP, EASE_IN_OUT } from "../lib/anim";
import { COLORS, CONTENT, SCENES, rgba } from "../theme";

/**
 * Repères d'interface très discrets en bas de la zone utile (scènes 2 à 5) : deux
 * équerres qui se tracent, comme le pied d'un écran de télémétrie. Le haut reste
 * libre : c'est la place des titres.
 */
const INSET = 14;
const ARM = 46;

export const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const on = interpolate(frame, [SCENES.track.from, SCENES.track.from + 30], [0, 1], { ...CLAMP, easing: EASE_IN_OUT });
  const off = interpolate(frame, [SCENES.outro.from - 12, SCENES.outro.from + 12], [0, 1], CLAMP);
  const visible = on * (1 - off);
  if (visible <= 0) return null;

  const x0 = CONTENT.x + INSET;
  const x1 = CONTENT.x + CONTENT.w - INSET;
  const y1 = CONTENT.y + CONTENT.h - INSET;
  const corners: [number, number, number, number][] = [
    [x0, y1, 1, -1],
    [x1, y1, -1, -1],
  ];
  const draw = on;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.4 * (1 - off) }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {corners.map(([x, y, dx, dy], i) => (
          <path
            key={i}
            d={`M ${x} ${y + dy * ARM} L ${x} ${y} L ${x + dx * ARM} ${y}`}
            fill="none"
            stroke={COLORS.text}
            strokeWidth={3}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
        ))}
        {/* Petit trait au milieu du bord bas. */}
        <line
          x1={CONTENT.x + CONTENT.w / 2}
          y1={y1}
          x2={CONTENT.x + CONTENT.w / 2}
          y2={y1 - 16 * draw}
          stroke={rgba(COLORS.text, 0.9)}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </svg>
    </AbsoluteFill>
  );
};
