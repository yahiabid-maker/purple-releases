import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CLAMP, EASE_IN_OUT } from "../lib/anim";
import { COLORS, CONTENT, SCENES, rgba } from "../theme";

/**
 * Repères d'interface très discrets aux coins de la zone utile (scènes 2 à 5) :
 * des équerres qui se tracent, comme le cadre d'un écran de télémétrie.
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
  const y0 = CONTENT.y + INSET;
  const y1 = CONTENT.y + CONTENT.h - INSET;
  const corners: [number, number, number, number][] = [
    [x0, y0, 1, 1],
    [x1, y0, -1, 1],
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
        {/* Petits traits au milieu des bords. */}
        {[
          [CONTENT.x + CONTENT.w / 2, y0, 0, 1],
          [CONTENT.x + CONTENT.w / 2, y1, 0, -1],
        ].map(([x, y, , dy], i) => (
          <line key={i} x1={x} y1={y} x2={x} y2={y + dy * 16 * draw} stroke={rgba(COLORS.text, 0.9)} strokeWidth={3} strokeLinecap="round" />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
